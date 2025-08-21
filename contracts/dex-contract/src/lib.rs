pub mod contract;
pub mod error;
pub mod msg;
pub mod state;
pub mod execute;
pub mod query;

pub use crate::error::ContractError;

// Export the contract entry points for WASM compilation
pub use crate::contract::{execute, instantiate, query};