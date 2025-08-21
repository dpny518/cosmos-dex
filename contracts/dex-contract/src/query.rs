use cosmwasm_std::{Deps, Order, StdResult, Uint128};
use cw_storage_plus::Bound;

use crate::msg::{Config, LiquidityInfo, PoolInfo, SimulationResponse};
use crate::state::{liquidity_key, pool_key, CONFIG, LIQUIDITY, POOLS};

pub fn query_config(deps: Deps) -> StdResult<Config> {
    let config = CONFIG.load(deps.storage)?;
    Ok(Config {
        admin: config.admin,
        fee_rate: config.fee_rate,
    })
}

pub fn query_pool(deps: Deps, token_a: String, token_b: String) -> StdResult<PoolInfo> {
    let key = pool_key(&token_a, &token_b);
    let pool = POOLS.load(deps.storage, key)?;
    
    Ok(PoolInfo {
        token_a: pool.token_a,
        token_b: pool.token_b,
        reserve_a: pool.reserve_a,
        reserve_b: pool.reserve_b,
        total_liquidity: pool.total_liquidity,
    })
}

pub fn query_pools(
    deps: Deps,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<PoolInfo>> {
    let limit = limit.unwrap_or(10).min(30) as usize;
    
    let start = start_after.map(|s| Bound::exclusive(pool_key(&s, "")));
    
    POOLS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .map(|item| {
            let (_, pool) = item?;
            Ok(PoolInfo {
                token_a: pool.token_a,
                token_b: pool.token_b,
                reserve_a: pool.reserve_a,
                reserve_b: pool.reserve_b,
                total_liquidity: pool.total_liquidity,
            })
        })
        .collect()
}

pub fn query_liquidity(
    deps: Deps,
    user: String,
    token_a: String,
    token_b: String,
) -> StdResult<LiquidityInfo> {
    let user_addr = deps.api.addr_validate(&user)?;
    let key = pool_key(&token_a, &token_b);
    let pool = POOLS.load(deps.storage, key.clone())?;
    
    let liq_key = liquidity_key(&user_addr, &key.0, &key.1);
    let position = LIQUIDITY.may_load(deps.storage, liq_key)?
        .unwrap_or_else(|| crate::state::LiquidityPosition {
            liquidity: Uint128::zero(),
        });

    // Calculate user's share of the pool
    let share_a = if pool.total_liquidity.is_zero() {
        Uint128::zero()
    } else {
        position.liquidity * pool.reserve_a / pool.total_liquidity
    };
    
    let share_b = if pool.total_liquidity.is_zero() {
        Uint128::zero()
    } else {
        position.liquidity * pool.reserve_b / pool.total_liquidity
    };

    Ok(LiquidityInfo {
        liquidity: position.liquidity,
        share_a,
        share_b,
    })
}

pub fn query_simulation(
    deps: Deps,
    token_in: String,
    token_out: String,
    amount_in: Uint128,
) -> StdResult<SimulationResponse> {
    let key = pool_key(&token_in, &token_out);
    let pool = POOLS.load(deps.storage, key)?;
    let config = CONFIG.load(deps.storage)?;

    // Determine which reserves to use
    let (reserve_in, reserve_out) = if token_in == pool.token_a {
        (pool.reserve_a, pool.reserve_b)
    } else {
        (pool.reserve_b, pool.reserve_a)
    };

    // Calculate output amount with fee
    let fee_denominator = Uint128::from(10000u128);
    let amount_in_after_fee = amount_in * (fee_denominator - config.fee_rate) / fee_denominator;
    let amount_out = amount_in_after_fee * reserve_out / (reserve_in + amount_in_after_fee);
    let fee = amount_in - amount_in_after_fee;

    // Calculate price impact
    let price_before = reserve_out * Uint128::from(10000u128) / reserve_in;
    let new_reserve_in = reserve_in + amount_in;
    let new_reserve_out = reserve_out - amount_out;
    let price_after = new_reserve_out * Uint128::from(10000u128) / new_reserve_in;
    
    let price_impact_bps = if price_before > price_after {
        (price_before - price_after) * Uint128::from(10000u128) / price_before
    } else {
        (price_after - price_before) * Uint128::from(10000u128) / price_before
    };

    Ok(SimulationResponse {
        amount_out,
        fee,
        price_impact: format!("{}%", price_impact_bps.u128() as f64 / 100.0),
    })
}