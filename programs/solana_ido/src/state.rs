use {crate::errors::ErrorCode, anchor_lang::prelude::*};

pub const SOL_VAULT_SEED: &str = "presale-escrow-vault";
pub const ADMIN_MANAGE_SEED: &str = "admin-role";
pub const USER_ACCOUNT_SEED: &str = "user-role";
pub const PRESALE_INFO_SEED: &str = "presale-info";
pub const TOKEN_VAULT_SEED: &str = "token-vault";
pub const PRESALE_TOKEN_MINT_PUBKEY: &str = "85hr9mrrv2SHuWsEB58y7HhyKM76C88gVo8W5ee4fvcu";

// pub const ADMIN_ACCOUNT_SIZE: usize = 8 + std::mem::size_of::<AdminAccount>() + 8;
// pub const USER_ACCOUNT_SIZE: usize = 8 + std::mem::size_of::<UserAccount>() + 8;
// pub const PRESALE_ACCOUNT_SIZE: usize = 8 + std::mem::size_of::<PresaleAccount>() + 8;

pub const ADMIN_ACCOUNT_SIZE: usize = 8 + 32;           // 40 bytes
pub const USER_ACCOUNT_SIZE: usize = 8 + 1 + 8 + 8 + 1 + 32; // 58 bytes
pub const PRESALE_ACCOUNT_SIZE: usize 
    = 8 + 4 + 8 + 4 + 8 + 8 + 8 + 8 + 8 + 4 + 8 + 8 + 1 + 1 + 8 + 4 + 1 + 1;    // 100 bytes

#[account]
pub struct AdminAccount {
    pub super_admin: Pubkey,        // 32 byte
}

#[account]
pub struct UserAccount {
    /// CHECK:
    pub is_whitelisted: bool,       // 1 byte
    pub user_buy_amount: u64,       // 8 byte
    pub user_sol_contributed: u64,  // 8 byte
    pub is_claimed: u8,             // 1 byte
    pub public_key: Pubkey,         // 32 byte
}

#[account]
pub struct PresaleAccount {
    pub team_percent: u32,              // 4 byte  10% : 1000
    pub presale_rate: u64,              // 8 byte
    pub total_whitelisted_wallets: u32, // 4 byte
    pub user_max_buy: u64,              // 8 byte
    pub start_time: u64,                // 8 byte
    pub end_time: u64,                  // 8 byte
    pub presale_duration: u64,          // 8 byte
    pub price: u64,                     // 8 byte
    pub total_participants: u32,        // 4 byte
    pub total_sol_amount: u64,          // 8 byte
    pub total_token_amount: u64,        // 8 byte
    pub is_finalized: u8,               // 1 byte
    pub is_cancelled: u8,               // 1 byte
    pub soft_cap: u64,                  // 8 byte
    pub token_allocation: u32,          // 4 byte   5000 (50% of total token amount)
    // pub white_list: Vec<String>,        // 4 + 0 byte
    // pub users_bought: Vec<String>,      // 4 + 0 byte   String is pubkey 32byte
    pub is_hardcapped: u8,              // 1 byte
    pub is_softcapped: u8,              // 1 byte
}

#[event]
pub struct UserBought {
    pub user: Pubkey,       // 32 byte
    pub amount: u64,        // 8 byte
    pub time_stamp: u32,    // 4 byte
}

#[event]
pub struct UserClaimed {
    pub user: Pubkey,       // 32 byte
    pub amount: u64,        // 8 byte
    pub time_stamp: u32,    // 4 byte
}

#[event]
pub struct RefundToken {
    pub user: Pubkey,       // 32 byte
    pub amount: u64,        // 8 byte
    pub time_stamp: u32,    // 4 byte
}

#[event]
pub struct UpdatePresaleDetails {
    pub start_time: u32,            // 4 byte
    pub end_time: u32,              // 4 byte
    pub time_stamp: u32,            // 4 byte
}

#[event]
pub struct PresaleFinalized {
    pub total_amount: u64,          // 8 byte
    pub time_stamp: u32,            // 4 byte
}

#[event]
pub struct PresaleCancelled {
    pub total_amount: u64,          // 8 byte
    pub time_stamp: u32,            // 4 byte
}

pub fn is_admin<'info>(
    admin_account: &Account<'info, AdminAccount>,
    signer: &Signer<'info>,
) -> Result<()> {
    if admin_account.super_admin != *signer.key {
        return Err(error!(ErrorCode::AccessDenied));
    }
    Ok(())
}

pub fn is_finalized<'info>(presale_account: &Account<'info, PresaleAccount>) -> Result<()> {
    if presale_account.is_finalized != 0 {
        return Err(error!(ErrorCode::PresaleNotFinished));
    }
    Ok(())
}

pub fn is_cancelled<'info>(presale_account: &Account<'info, PresaleAccount>) -> Result<()> {
    if presale_account.is_cancelled != 1 {
        return Err(error!(ErrorCode::PresaleNotCancelled));
    }
    Ok(())
}

pub fn is_presale_live<'info>(presale_account: &Account<'info, PresaleAccount>) -> Result<()> {
    if presale_account.start_time > Clock::get().unwrap().unix_timestamp as u64 {
        return Err(error!(ErrorCode::PresaleNotStarted));
    }
    if presale_account.end_time < Clock::get().unwrap().unix_timestamp as u64 {
        return Err(error!(ErrorCode::PresaleAlreadyEnded));
    }
    Ok(())
}
