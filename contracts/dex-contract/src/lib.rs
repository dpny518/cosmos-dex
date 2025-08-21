pub mod contract;
pub mod error;
pub mod msg;
pub mod state;
pub mod execute;
pub mod query;

pub use crate::error::ContractError;

// Re-export contract entry points for the optimizer
pub use crate::contract::{instantiate, execute, query};