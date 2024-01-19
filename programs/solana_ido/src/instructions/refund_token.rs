// use anchor_lang::solana_program::{program::invoke, program::invoke_signed, system_instruction};
use {anchor_lang::prelude::*, crate::errors::ErrorCode, crate::state::*};

#[derive(Accounts)]
pub struct RefundToken<'info> {
    /// CHECK: This is wallet
    #[account(
        mut,
        seeds = [ SOL_VAULT_SEED.as_bytes() ],
        bump,
    )]
    pub escrow_account: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [ PRESALE_INFO_SEED.as_bytes() ],
        bump,
    )]
    pub presale_account: Box<Account<'info, PresaleAccount>>,
    #[account(mut)]
    pub user_account: Box<Account<'info, UserAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: This is receiver account
    #[account(mut)]
    pub user_to_refund: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RefundToken>) -> Result<()> {
    if ctx.accounts.presale_account.is_cancelled == 0 {
        return Err(error!(ErrorCode::PresaleNotCancelled)); 
    }
    let amount = ctx.accounts.user_account.user_sol_contributed;
    if amount <= 0   { return Ok(()) }
    
    let sol_in_escrow = **ctx.accounts.escrow_account.lamports.borrow();

    if sol_in_escrow < amount {
        return Err(error!(ErrorCode::NoEnoughSol));
    }
    
    **ctx.accounts.escrow_account.try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.user_to_refund.try_borrow_mut_lamports()? += amount;

    ctx.accounts.presale_account.total_sol_amount -= amount;
    ctx.accounts.presale_account.total_participants -= 1;
    Ok(())
}
