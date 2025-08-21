use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Insufficient funds")]
    InsufficientFunds {},

    #[error("Pool not found")]
    PoolNotFound {},

    #[error("Pool already exists")]
    PoolAlreadyExists {},

    #[error("Invalid pool ratio")]
    InvalidPoolRatio {},

    #[error("Slippage tolerance exceeded")]
    SlippageExceeded {},

    #[error("Minimum liquidity not met")]
    MinLiquidityNotMet {},

    #[error("Zero amount not allowed")]
    ZeroAmount {},

    #[error("Invalid token pair")]
    InvalidTokenPair {},
}