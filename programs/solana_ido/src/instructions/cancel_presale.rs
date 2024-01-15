use anchor_lang::solana_program::{program::invoke, system_instruction};

use {anchor_lang::prelude::*, crate::state::*};

#[derive(Accounts)]
pub struct CancelPresale<'info> {
    #[account(
        mut,
        seeds = [ PRESALE_INFO_SEED.as_bytes() ],
        bump,
    )]
    pub presale_account: Box<Account<'info, PresaleAccount>>,

    #[account( mut,
        seeds = [ USER_ACCOUNT_SEED.as_bytes(), recipient.key().as_ref() ],
        bump)]
    pub user_account: Box<Account<'info, UserAccount>>,

    #[account(
        mut,
        seeds = [ SOL_VAULT_SEED.as_bytes() ],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub escrow_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub admin_account: Box<Account<'info, AdminAccount>>,
    /// CHECK: This is not dangerous
    pub recipient: UncheckedAccount<'info>, 
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[access_control(is_admin(&ctx.accounts.admin_account, &ctx.accounts.admin))]
pub fn handler(ctx: Context<CancelPresale>, amount: u64, idx: u64 ) -> Result<()> {

    let users_bought = &mut ctx.accounts.presale_account.users_bought;
    let count = users_bought.len();

    invoke(
        &system_instruction::transfer(
            ctx.accounts.escrow_account.key,
            ctx.accounts.recipient.key,
            amount,
        ),
        &[
            ctx.accounts.escrow_account.to_account_info().clone(),
            ctx.accounts.recipient.to_account_info().clone(),
            ctx.accounts.system_program.to_account_info().clone(),
        ],
    )?;

    // ctx.accounts.presale_account.is_cancelled = 1;
    // let users_bought = &mut ctx.accounts.presale_account.users_bought;
    // let count: usize = users_bought.len();

    let count = ctx.accounts.presale_account.users_bought.len() as u64;
    if count == idx + 1 {
        ctx.accounts.presale_account.is_cancelled = 1;

        emit!(PresaleCancelled {
            total_amount: ctx.accounts.presale_account.total_sol_amount,
            time_stamp: Clock::get().unwrap().unix_timestamp as u32
        });

    } 

    Ok(())
}
