use anchor_lang::solana_program::{program::invoke, system_instruction};
use {crate::errors::ErrorCode, crate::state::*, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct BuyToken<'info> {
    #[account(
        mut,
        seeds = [ SOL_VAULT_SEED.as_bytes() ],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub escrow_account: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [ PRESALE_INFO_SEED.as_bytes() ],
        bump,
    )]
    pub presale_account: Box<Account<'info, PresaleAccount>>,
    #[account( mut,
        seeds = [ USER_ACCOUNT_SEED.as_bytes(), authority.key().as_ref() ],
        bump)]
    pub user_account: Box<Account<'info, UserAccount>>,
    //the authority allowed to transfer sol
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

//amount in SOL
#[access_control(is_presale_live(&ctx.accounts.presale_account))]
pub fn handler(ctx: Context<BuyToken>, amount: u64) -> Result<()> {
    let presale_account = &mut ctx.accounts.presale_account;
    if presale_account.is_cancelled == 1 {
        return Err(error!(ErrorCode::PresaleCancelled));
    }
    if ctx.accounts.user_account.is_whitelisted == false {
        return Err(error!(ErrorCode::NotInWhiteList));
    }
    if presale_account.user_max_buy < amount {
        return Err(error!(ErrorCode::MaxBuyAmountExceeded));
    }
    if **ctx.accounts.authority.lamports.borrow() < amount {
        return Err(error!(ErrorCode::NoEnoughSol));
    }

    // Calculate the number of tokens to allocate to the user.
    // Both 'fixed_presale_rate' and 'amount' are now integers, so this operation is straightforward.
    let mut tokens_to_allocate = presale_account.presale_rate * amount;
    let mut sol_to_transfer = amount;

    // check if presale reached the hard cap
    if presale_account.total_token_remained <= tokens_to_allocate {
        presale_account.is_hardcapped = 1;
        tokens_to_allocate = presale_account.total_token_remained;
        sol_to_transfer = presale_account.total_token_remained / presale_account.presale_rate;

        msg!("The token balance in token vault is not enough, user buy all remaining tokens");
    }

    // transfer bet amount to escrow account
    invoke(
        &system_instruction::transfer(
            ctx.accounts.authority.key,
            ctx.accounts.escrow_account.key,
            sol_to_transfer,
        ),
        &[
            ctx.accounts.authority.to_account_info().clone(),
            ctx.accounts.escrow_account.to_account_info().clone(),
            ctx.accounts.system_program.to_account_info().clone(),
        ],
    )?;

    if ctx.accounts.user_account.user_buy_amount == 0 {
        presale_account.total_participants += 1;
    }

    // Update total SOL amount received in the presale account.
    presale_account.total_sol_amount += sol_to_transfer;

    // Update the user account with the amount of SOL they contributed.
    ctx.accounts.user_account.user_sol_contributed += sol_to_transfer;

    // Update the user account with the number of tokens they will receive.
    ctx.accounts.user_account.user_buy_amount += tokens_to_allocate;
    presale_account.total_token_remained -= tokens_to_allocate;
    if presale_account.total_token_remained < presale_account.soft_cap {
        if presale_account.is_softcapped == 0 {
            presale_account.is_softcapped = 1;
        }
    } else {
        presale_account.presale_rate = presale_account.presale_rate;
            // * (presale_account.total_presale_token
            //     / (presale_account.total_presale_token * 2 - presale_account.total_token_remained));
    }

    emit!(UserBought {
        user: *ctx.accounts.authority.key,
        amount: sol_to_transfer,
        time_stamp: Clock::get().unwrap().unix_timestamp as u32
    });

    Ok(())
}
