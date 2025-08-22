use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::execute::{
    execute_add_liquidity, execute_create_pool, execute_remove_liquidity, execute_swap,
    execute_update_admin, execute_update_fee_rate, execute_update_lp_token_code_id,
};
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::query::{
    query_config, query_liquidity, query_pool, query_pools, query_simulation,
};
use crate::state::{Config, CONFIG};

const CONTRACT_NAME: &str = "crates.io:dex-contract";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let admin = msg
        .admin
        .map(|addr| deps.api.addr_validate(&addr))
        .transpose()?
        .unwrap_or(info.sender.clone());

    let config = Config {
        admin,
        fee_rate: msg.fee_rate,
        lp_token_code_id: msg.lp_token_code_id,
    };

    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", info.sender)
        .add_attribute("fee_rate", msg.fee_rate)
        .add_attribute("lp_token_code_id", msg.lp_token_code_id.to_string()))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreatePool {
            token_a,
            token_b,
            initial_a,
            initial_b,
        } => execute_create_pool(deps, env, info, token_a, token_b, initial_a, initial_b),
        ExecuteMsg::AddLiquidity {
            token_a,
            token_b,
            amount_a,
            amount_b,
            min_liquidity,
        } => execute_add_liquidity(deps, env, info, token_a, token_b, amount_a, amount_b, min_liquidity),
        ExecuteMsg::RemoveLiquidity {
            token_a,
            token_b,
            liquidity,
            min_a,
            min_b,
        } => execute_remove_liquidity(deps, env, info, token_a, token_b, liquidity, min_a, min_b),
        ExecuteMsg::Swap {
            token_in,
            token_out,
            amount_in,
            min_amount_out,
        } => execute_swap(deps, env, info, token_in, token_out, amount_in, min_amount_out),
        ExecuteMsg::UpdateAdmin { admin } => execute_update_admin(deps, info, admin),
        ExecuteMsg::UpdateFeeRate { fee_rate } => execute_update_fee_rate(deps, info, fee_rate),
        ExecuteMsg::UpdateLpTokenCodeId { lp_token_code_id } => execute_update_lp_token_code_id(deps, info, lp_token_code_id),
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&query_config(deps)?),
        QueryMsg::Pool { token_a, token_b } => to_json_binary(&query_pool(deps, token_a, token_b)?),
        QueryMsg::Pools { start_after, limit } => to_json_binary(&query_pools(deps, start_after, limit)?),
        QueryMsg::Liquidity {
            user,
            token_a,
            token_b,
        } => to_json_binary(&query_liquidity(deps, user, token_a, token_b)?),
        QueryMsg::Simulation {
            token_in,
            token_out,
            amount_in,
        } => to_json_binary(&query_simulation(deps, token_in, token_out, amount_in)?),
    }
}