use anchor_spl::token::{self, Mint, Token, TokenAccount};
use {crate::account, crate::errors::ErrorCode, crate::state::*, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct ClaimToken<'info> {
    #[account(
        mut
        // address = PRESALE_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
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
    #[account(
        mut,
        seeds = [ USER_ACCOUNT_SEED.as_bytes(), user_to.key().as_ref() ],
        bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,
    // the authority allowed to transfer token
    #[account(mut)]
    /// CHECK: we send token to user
    pub user_to: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

// #[access_control(is_finalized(&ctx.accounts.presale_account))]
pub fn handler(
    ctx: Context<ClaimToken>, // , nonce_vault: u8, token_vault_bump: u8, presale_account_bump: u8
) -> Result<()> {
   
    let sender = &mut ctx.accounts.authority;
    let sender_tokens = &mut ctx.accounts.token_vault;
    let recipient_tokens = &mut ctx.accounts.token_to;
    let token_program = &mut ctx.accounts.token_program;
    let amount = ctx.accounts.user_account.user_buy_amount;

    if ctx.accounts.user_account.user_buy_amount <= 0 {
        return Err(error!(ErrorCode::NoClaimableToken));
    }
    if ctx.accounts.user_account.is_whitelisted == false {
        return Err(error!(ErrorCode::NotInWhiteList));
    }
    if sender_tokens.amount < amount {
        return Err(error!(ErrorCode::PresaleNotEnoughToken));
    }

    token::transfer(
        CpiContext::new(
            token_program.clone().to_account_info(),
            token::Transfer {
                from: sender_tokens.to_account_info().clone(),
                to: recipient_tokens.to_account_info().clone(),
                authority: sender.to_account_info().clone(),
            },
        ),
        amount,
    )?;
    ctx.accounts.user_account.is_claimed = 1;

    emit!(UserClaimed {
        user: *ctx.accounts.authority.key,
        amount: amount,
        time_stamp: Clock::get().unwrap().unix_timestamp as u32
    });
    Ok(())
}
