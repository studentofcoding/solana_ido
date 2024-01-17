// #![feature(build_hasher_simple_hash_one)]

pub mod errors;
pub mod instructions;
pub mod state;

use {anchor_lang::prelude::*, instructions::*};

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("3SR3iCToALQU9yDZ68WnQnB4nJEX4WjykKERSfUKn9Pc");

#[program]
mod token_presale {
    use super::*;
    pub fn initialize(
        ctx: Context<Initialize>, 
        team_percent: u32, 
        presale_rate: u64,
        user_max_buy: u64,
        presale_duration: u64,
        price: u64,
        total_token_amount: u64,
        token_allocation: u32,
        softcap_precent: u32
    ) -> Result<()> {
        initialize::handler(ctx, team_percent, presale_rate, user_max_buy, presale_duration, price,total_token_amount, token_allocation, softcap_precent)
    }

    pub fn buy_token(ctx: Context<BuyToken>, amount: u64) -> Result<()> {
        buy_token::handler(ctx, amount)
    }

    pub fn refund_token(ctx: Context<RefundToken>) -> Result<()> {
        refund_token::handler(ctx)
    }

    pub fn claim_token(
        ctx: Context<ClaimToken>,
        nonce_vault: u8,
        token_vault_bump: u8,
        presale_account_bump: u8,
    ) -> Result<()> {
        claim_token::handler(ctx, nonce_vault, token_vault_bump, presale_account_bump)
    }

    pub fn cancel_presale(ctx: Context<CancelPresale>) -> Result<()> {
        cancel_presale::handler(ctx)
    }

    // Handle update presale details
    pub fn update_presale_details(
        ctx: Context<UpdatePresaleDetails>,
        price: u64,
        start_time: u64,
        end_time: u64,
        // token_allocation: u64,
    ) -> Result<()> {
        update_presale_details::handler(ctx, price, start_time, end_time)
    }

    // pub fn set_whitelist(ctx: Context<SetWhitelist>, has_whitelist: u8) -> Result<()> {
    //     set_whitelist:: handler(ctx, has_whitelist)
    // }

    pub fn add_whitelist(ctx: Context<AddWhitelist>) -> Result<()> {
        add_whitelist::handler(ctx)
    }

    pub fn remove_whitelist(ctx: Context<RemoveWhitelist>) -> Result<()> {
        remove_whitelist::handler(ctx)
    }

    pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
        finalize::handler(ctx)
    }

    pub fn deposit_token(ctx: Context<DepositToken>, mint: Pubkey, amount: u64) -> Result<()> {
        deposit_token::handler(ctx, mint, amount)
    }

    pub fn withdraw_token(ctx: Context<WithdrawToken>, nonce_vault: u8) -> Result<()> {
        withdraw_token::handler(ctx, nonce_vault)
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        withdraw::handler(ctx)
    }
}
