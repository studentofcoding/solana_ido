use anchor_spl::token::{ Mint, Token, TokenAccount};
use {anchor_lang::prelude::*, crate::state::*};


// These are the Accounts to hold Vault and details
#[derive(Accounts)]
pub struct Initialize<'info> {
    // #[account(
    //     address = PRESALE_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    // )]
    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = admin,
        token::mint = token_mint,
        token::authority = admin, //the PDA address is both the vault account and the authority (and event the mint authority)
        seeds = [token_mint.key().as_ref(), TOKEN_VAULT_SEED.as_bytes()],
        bump,
    )]
    ///the not-yet-created, derived token vault pubkey
    pub token_vault: Box<Account<'info, TokenAccount>>,
    
    #[account(
        init,
        payer = admin,
        seeds = [ ADMIN_MANAGE_SEED.as_bytes(), admin.key().as_ref() ],
        bump,
        space = ADMIN_ACCOUNT_SIZE
    )]
    pub admin_account: Box<Account<'info, AdminAccount>>,
    /// CHECK: This is vault account.
    #[account(
        init,
        payer = admin,
        seeds = [ SOL_VAULT_SEED.as_bytes() ],
        bump,
        space = 8 + 8
    )]
    pub escrow_account: UncheckedAccount<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [ PRESALE_INFO_SEED.as_bytes() ],
        bump,
        space = PRESALE_ACCOUNT_SIZE
    )]
    pub presale_account: Box<Account<'info, PresaleAccount>>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
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
    ctx.accounts.admin_account.super_admin = *ctx.accounts.admin.key;

    let presale_account = &mut ctx.accounts.presale_account;
    presale_account.team_percent = team_percent;
    presale_account.presale_rate = presale_rate;
    presale_account.total_whitelisted_wallets = 0;
    presale_account.user_max_buy = user_max_buy;
    presale_account.presale_duration = presale_duration;
    presale_account.start_time = Clock::get().unwrap().unix_timestamp as u64;
    presale_account.end_time = presale_account.start_time + presale_duration;
    presale_account.is_finalized = 0;
    presale_account.is_cancelled = 0;
    presale_account.soft_cap = total_token_amount * softcap_precent as u64 / 10000;  // 25%
    presale_account.token_allocation = token_allocation;
    presale_account.total_token_amount = total_token_amount;
    presale_account.price = price;
    presale_account.is_softcapped = 0;
    presale_account.is_hardcapped = 0;
    Ok(())
}
