use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub fee_rate: Uint128, // Fee rate in basis points
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Pool {
    pub token_a: String,
    pub token_b: String,
    pub reserve_a: Uint128,
    pub reserve_b: Uint128,
    pub total_liquidity: Uint128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct LiquidityPosition {
    pub liquidity: Uint128,
}

// Contract configuration
pub const CONFIG: Item<Config> = Item::new("config");

// Pool storage: (token_a, token_b) -> Pool
pub const POOLS: Map<(String, String), Pool> = Map::new("pools");

// Liquidity positions: (user, token_a, token_b) -> LiquidityPosition
pub const LIQUIDITY: Map<(Addr, String, String), LiquidityPosition> = Map::new("liquidity");

// Helper function to create pool key (ensures consistent ordering)
pub fn pool_key(token_a: &str, token_b: &str) -> (String, String) {
    if token_a < token_b {
        (token_a.to_string(), token_b.to_string())
    } else {
        (token_b.to_string(), token_a.to_string())
    }
}

// Helper function to create liquidity key
pub fn liquidity_key(user: &Addr, token_a: &str, token_b: &str) -> (Addr, String, String) {
    let (a, b) = pool_key(token_a, token_b);
    (user.clone(), a, b)
}