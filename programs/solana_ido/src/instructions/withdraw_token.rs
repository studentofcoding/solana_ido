use anchor_spl::token::{self, Mint, Token, TokenAccount};
use {anchor_lang::prelude::*, crate::errors::ErrorCode, crate::state::*};

#[derive(Accounts)]
pub struct WithdrawToken<'info> {
    #[account(
        mut
        // address = PRESALE_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    //the token account to withdraw to
    pub token_to: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ token_mint.key().as_ref(), TOKEN_VAULT_SEED.as_bytes() ],
        bump,
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ PRESALE_INFO_SEED.as_bytes() ],
        bump,
    )]
    pub presale_account: Box<Account<'info, PresaleAccount>>,
    #[account(mut)]
    pub admin_account: Box<Account<'info, AdminAccount>>,
    //the authority allowed to transfer from token_from
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[access_control(is_admin(&ctx.accounts.admin_account, &ctx.accounts.admin))]
#[access_control(is_finalized(&ctx.accounts.presale_account))]
pub fn handler(ctx: Context<WithdrawToken>, _nonce_vault: u8) -> Result<()> {
 
    if ctx.accounts.presale_account.is_cancelled == 1 {
        return Err(error!(ErrorCode::PresaleCancelled ))
    }
    let amount = ctx.accounts.token_vault.amount;
    //transfer from vault to admin
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.clone().to_account_info(),
        token::Transfer {
            from: ctx.accounts.token_vault.to_account_info().clone(),
            to: ctx.accounts.token_to.to_account_info().clone(),
            authority: ctx.accounts.admin.to_account_info().clone(),
        },
        // signer,
    );
    token::transfer(cpi_ctx, amount)?;

    ctx.accounts.presale_account.total_token_amount = 0;
    Ok(())
}
