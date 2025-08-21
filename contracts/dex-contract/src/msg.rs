use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Uint128};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub fee_rate: Uint128, // Fee rate in basis points (e.g., 30 = 0.3%)
}

#[cw_serde]
pub enum ExecuteMsg {
    // Create a new trading pair pool
    CreatePool {
        token_a: String,
        token_b: String,
        initial_a: Uint128,
        initial_b: Uint128,
    },
    // Add liquidity to an existing pool
    AddLiquidity {
        token_a: String,
        token_b: String,
        amount_a: Uint128,
        amount_b: Uint128,
        min_liquidity: Uint128,
    },
    // Remove liquidity from a pool
    RemoveLiquidity {
        token_a: String,
        token_b: String,
        liquidity: Uint128,
        min_a: Uint128,
        min_b: Uint128,
    },
    // Swap tokens
    Swap {
        token_in: String,
        token_out: String,
        amount_in: Uint128,
        min_amount_out: Uint128,
    },
    // Update contract admin
    UpdateAdmin {
        admin: String,
    },
    // Update fee rate (admin only)
    UpdateFeeRate {
        fee_rate: Uint128,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    // Get contract config
    #[returns(Config)]
    Config {},
    // Get pool information
    #[returns(PoolInfo)]
    Pool { token_a: String, token_b: String },
    // Get all pools
    #[returns(Vec<PoolInfo>)]
    Pools {
        start_after: Option<String>,
        limit: Option<u32>,
    },
    // Get user's liquidity position
    #[returns(LiquidityInfo)]
    Liquidity {
        user: String,
        token_a: String,
        token_b: String,
    },
    // Get swap simulation
    #[returns(SimulationResponse)]
    Simulation {
        token_in: String,
        token_out: String,
        amount_in: Uint128,
    },
}

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub fee_rate: Uint128,
}

#[cw_serde]
pub struct PoolInfo {
    pub token_a: String,
    pub token_b: String,
    pub reserve_a: Uint128,
    pub reserve_b: Uint128,
    pub total_liquidity: Uint128,
}

#[cw_serde]
pub struct LiquidityInfo {
    pub liquidity: Uint128,
    pub share_a: Uint128,
    pub share_b: Uint128,
}

#[cw_serde]
pub struct SimulationResponse {
    pub amount_out: Uint128,
    pub fee: Uint128,
    pub price_impact: String,
}