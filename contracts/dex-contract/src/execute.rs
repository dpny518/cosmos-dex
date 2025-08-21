use cosmwasm_std::{
    coin, BankMsg, CosmosMsg, DepsMut, Env, MessageInfo, Response, Uint128, WasmMsg, to_json_binary,
};
use cw20::Cw20ExecuteMsg;

use crate::error::ContractError;
use crate::state::{liquidity_key, pool_key, LiquidityPosition, Pool, CONFIG, LIQUIDITY, POOLS};

pub fn execute_create_pool(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    token_a: String,
    token_b: String,
    initial_a: Uint128,
    initial_b: Uint128,
) -> Result<Response, ContractError> {
    if initial_a.is_zero() || initial_b.is_zero() {
        return Err(ContractError::ZeroAmount {});
    }

    if token_a == token_b {
        return Err(ContractError::InvalidTokenPair {});
    }

    let key = pool_key(&token_a, &token_b);
    
    if POOLS.has(deps.storage, key.clone()) {
        return Err(ContractError::PoolAlreadyExists {});
    }

    // Calculate initial liquidity (geometric mean) - using integer square root approximation
    let product = initial_a * initial_b;
    let mut initial_liquidity = Uint128::zero();
    if !product.is_zero() {
        // Simple integer square root approximation
        let mut x = product;
        let mut y = (x + Uint128::from(1u128)) / Uint128::from(2u128);
        while y < x {
            x = y;
            y = (x + product / x) / Uint128::from(2u128);
        }
        initial_liquidity = x;
    }
    
    if initial_liquidity.is_zero() {
        return Err(ContractError::MinLiquidityNotMet {});
    }

    let pool = Pool {
        token_a: key.0.clone(),
        token_b: key.1.clone(),
        reserve_a: initial_a,
        reserve_b: initial_b,
        total_liquidity: initial_liquidity,
    };

    POOLS.save(deps.storage, key.clone(), &pool)?;

    // Mint liquidity tokens to creator
    let liquidity_key = liquidity_key(&info.sender, &key.0, &key.1);
    let liquidity_position = LiquidityPosition {
        liquidity: initial_liquidity,
    };
    LIQUIDITY.save(deps.storage, liquidity_key, &liquidity_position)?;

    // Transfer tokens from user to contract
    let mut messages = vec![];
    
    // Handle native tokens (ATOM) and CW20 tokens
    if token_a == "uatom" {
        // Verify native token was sent
        let sent_amount = info.funds.iter()
            .find(|coin| coin.denom == "uatom")
            .map(|coin| coin.amount)
            .unwrap_or_else(Uint128::zero);
        
        if sent_amount < initial_a {
            return Err(ContractError::InsufficientFunds {});
        }
    } else {
        // CW20 token transfer
        messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: token_a.clone(),
            msg: to_json_binary(&Cw20ExecuteMsg::TransferFrom {
                owner: info.sender.to_string(),
                recipient: _env.contract.address.to_string(),
                amount: initial_a,
            })?,
            funds: vec![],
        }));
    }

    if token_b == "uatom" {
        let sent_amount = info.funds.iter()
            .find(|coin| coin.denom == "uatom")
            .map(|coin| coin.amount)
            .unwrap_or_else(Uint128::zero);
        
        if sent_amount < initial_b {
            return Err(ContractError::InsufficientFunds {});
        }
    } else {
        messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: token_b.clone(),
            msg: to_json_binary(&Cw20ExecuteMsg::TransferFrom {
                owner: info.sender.to_string(),
                recipient: _env.contract.address.to_string(),
                amount: initial_b,
            })?,
            funds: vec![],
        }));
    }

    Ok(Response::new()
        .add_messages(messages)
        .add_attribute("method", "create_pool")
        .add_attribute("token_a", token_a)
        .add_attribute("token_b", token_b)
        .add_attribute("initial_a", initial_a)
        .add_attribute("initial_b", initial_b)
        .add_attribute("liquidity", initial_liquidity))
}

pub fn execute_add_liquidity(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    token_a: String,
    token_b: String,
    amount_a: Uint128,
    amount_b: Uint128,
    min_liquidity: Uint128,
) -> Result<Response, ContractError> {
    let key = pool_key(&token_a, &token_b);
    let mut pool = POOLS.load(deps.storage, key.clone())?;

    // Calculate liquidity to mint
    let liquidity_a = amount_a * pool.total_liquidity / pool.reserve_a;
    let liquidity_b = amount_b * pool.total_liquidity / pool.reserve_b;
    let liquidity = liquidity_a.min(liquidity_b);

    if liquidity < min_liquidity {
        return Err(ContractError::MinLiquidityNotMet {});
    }

    // Update pool reserves
    pool.reserve_a += amount_a;
    pool.reserve_b += amount_b;
    pool.total_liquidity += liquidity;

    POOLS.save(deps.storage, key.clone(), &pool)?;

    // Update user's liquidity position
    let liq_key = liquidity_key(&info.sender, &key.0, &key.1);
    let mut position = LIQUIDITY.may_load(deps.storage, liq_key.clone())?
        .unwrap_or(LiquidityPosition { liquidity: Uint128::zero() });
    
    position.liquidity += liquidity;
    LIQUIDITY.save(deps.storage, liq_key, &position)?;

    Ok(Response::new()
        .add_attribute("method", "add_liquidity")
        .add_attribute("liquidity", liquidity))
}

pub fn execute_remove_liquidity(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    token_a: String,
    token_b: String,
    liquidity: Uint128,
    min_a: Uint128,
    min_b: Uint128,
) -> Result<Response, ContractError> {
    let key = pool_key(&token_a, &token_b);
    let mut pool = POOLS.load(deps.storage, key.clone())?;

    // Check user's liquidity position
    let liq_key = liquidity_key(&info.sender, &key.0, &key.1);
    let mut position = LIQUIDITY.load(deps.storage, liq_key.clone())?;

    if position.liquidity < liquidity {
        return Err(ContractError::InsufficientFunds {});
    }

    // Calculate amounts to return
    let amount_a = liquidity * pool.reserve_a / pool.total_liquidity;
    let amount_b = liquidity * pool.reserve_b / pool.total_liquidity;

    if amount_a < min_a || amount_b < min_b {
        return Err(ContractError::SlippageExceeded {});
    }

    // Update pool and position
    pool.reserve_a -= amount_a;
    pool.reserve_b -= amount_b;
    pool.total_liquidity -= liquidity;
    position.liquidity -= liquidity;

    POOLS.save(deps.storage, key.clone(), &pool)?;
    LIQUIDITY.save(deps.storage, liq_key, &position)?;

    // Send tokens back to user
    let mut messages = vec![];
    
    if token_a == "uatom" {
        messages.push(CosmosMsg::Bank(BankMsg::Send {
            to_address: info.sender.to_string(),
            amount: vec![coin(amount_a.u128(), "uatom")],
        }));
    } else {
        messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: token_a,
            msg: to_json_binary(&Cw20ExecuteMsg::Transfer {
                recipient: info.sender.to_string(),
                amount: amount_a,
            })?,
            funds: vec![],
        }));
    }

    if token_b == "uatom" {
        messages.push(CosmosMsg::Bank(BankMsg::Send {
            to_address: info.sender.to_string(),
            amount: vec![coin(amount_b.u128(), "uatom")],
        }));
    } else {
        messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: token_b,
            msg: to_json_binary(&Cw20ExecuteMsg::Transfer {
                recipient: info.sender.to_string(),
                amount: amount_b,
            })?,
            funds: vec![],
        }));
    }

    Ok(Response::new()
        .add_messages(messages)
        .add_attribute("method", "remove_liquidity")
        .add_attribute("amount_a", amount_a)
        .add_attribute("amount_b", amount_b))
}

pub fn execute_swap(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    token_in: String,
    token_out: String,
    amount_in: Uint128,
    min_amount_out: Uint128,
) -> Result<Response, ContractError> {
    if amount_in.is_zero() {
        return Err(ContractError::ZeroAmount {});
    }

    let key = pool_key(&token_in, &token_out);
    let mut pool = POOLS.load(deps.storage, key.clone())?;

    let config = CONFIG.load(deps.storage)?;

    // Determine which reserves to use
    let (reserve_in, reserve_out) = if token_in == pool.token_a {
        (pool.reserve_a, pool.reserve_b)
    } else {
        (pool.reserve_b, pool.reserve_a)
    };

    // Calculate output amount using constant product formula
    // amount_out = (amount_in * reserve_out) / (reserve_in + amount_in)
    // With fee: amount_in_after_fee = amount_in * (10000 - fee_rate) / 10000
    let fee_denominator = Uint128::from(10000u128);
    let amount_in_after_fee = amount_in * (fee_denominator - config.fee_rate) / fee_denominator;
    
    let amount_out = amount_in_after_fee * reserve_out / (reserve_in + amount_in_after_fee);

    if amount_out < min_amount_out {
        return Err(ContractError::SlippageExceeded {});
    }

    // Update pool reserves
    if token_in == pool.token_a {
        pool.reserve_a += amount_in;
        pool.reserve_b -= amount_out;
    } else {
        pool.reserve_b += amount_in;
        pool.reserve_a -= amount_out;
    }

    POOLS.save(deps.storage, key, &pool)?;

    // Send output tokens to user
    let mut messages = vec![];
    
    if token_out == "uatom" {
        messages.push(CosmosMsg::Bank(BankMsg::Send {
            to_address: info.sender.to_string(),
            amount: vec![coin(amount_out.u128(), "uatom")],
        }));
    } else {
        messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: token_out.clone(),
            msg: to_json_binary(&Cw20ExecuteMsg::Transfer {
                recipient: info.sender.to_string(),
                amount: amount_out,
            })?,
            funds: vec![],
        }));
    }

    let fee = amount_in - amount_in_after_fee;

    Ok(Response::new()
        .add_messages(messages)
        .add_attribute("method", "swap")
        .add_attribute("token_in", token_in)
        .add_attribute("token_out", token_out)
        .add_attribute("amount_in", amount_in)
        .add_attribute("amount_out", amount_out)
        .add_attribute("fee", fee))
}

pub fn execute_update_admin(
    deps: DepsMut,
    info: MessageInfo,
    admin: String,
) -> Result<Response, ContractError> {
    let mut config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    config.admin = deps.api.addr_validate(&admin)?;
    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("method", "update_admin")
        .add_attribute("new_admin", admin))
}

pub fn execute_update_fee_rate(
    deps: DepsMut,
    info: MessageInfo,
    fee_rate: Uint128,
) -> Result<Response, ContractError> {
    let mut config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    config.fee_rate = fee_rate;
    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("method", "update_fee_rate")
        .add_attribute("new_fee_rate", fee_rate))
}