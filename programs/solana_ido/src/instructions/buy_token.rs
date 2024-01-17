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
    if ctx.accounts.presale_account.is_cancelled == 1 {
        return Err(error!(ErrorCode::PresaleCancelled));
    }
    if ctx.accounts.user_account.is_whitelisted == false {
        return Err(error!(ErrorCode::NotInWhiteList));
    }
    if ctx.accounts.presale_account.user_max_buy < amount {
        return Err(error!(ErrorCode::MaxBuyAmountExceeded));
    }
    if **ctx.accounts.authority.lamports.borrow() < amount {
        return Err(error!(ErrorCode::NoEnoughSol));
    }
    let fixed_presale_rate: u64 = 100;
    // Calculate the number of tokens to allocate to the user.
    // Both 'fixed_presale_rate' and 'amount' are now integers, so this operation is straightforward.
    let tokens_to_allocate = fixed_presale_rate * amount;

    // check if presale reached the hard cap
    if ctx.accounts.presale_account.total_token_amount < tokens_to_allocate {
        ctx.accounts.presale_account.is_hardcapped = 1;
        ctx.accounts.presale_account.is_cancelled = 1;

        emit!(PresaleCancelled {
            total_amount: ctx.accounts.presale_account.total_sol_amount,
            time_stamp: Clock::get().unwrap().unix_timestamp as u32
        });

        return Err(error!(ErrorCode::NotEnoughTokenInVault));
    } else {
        // transfer bet amount to escrow account
        invoke(
            &system_instruction::transfer(
                ctx.accounts.authority.key,
                ctx.accounts.escrow_account.key,
                amount,
            ),
            &[
                ctx.accounts.authority.to_account_info().clone(),
                ctx.accounts.escrow_account.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
            ],
        )?;

        if ctx.accounts.user_account.user_buy_amount == 0 {
            ctx.accounts.presale_account.total_participants += 1;
        }

        // Update total SOL amount received in the presale account.
        ctx.accounts.presale_account.total_sol_amount += amount;

        // Update the user account with the amount of SOL they contributed.
        ctx.accounts.user_account.user_sol_contributed += amount;

        // Update the user account with the number of tokens they will receive.
        ctx.accounts.user_account.user_buy_amount += tokens_to_allocate;
        ctx.accounts.presale_account.total_token_amount -= tokens_to_allocate;
        if ctx.accounts.presale_account.total_token_amount < ctx.accounts.presale_account.soft_cap {
            ctx.accounts.presale_account.is_softcapped = 1;
        }

        emit!(UserBought {
            user: *ctx.accounts.authority.key,
            amount: amount,
            time_stamp: Clock::get().unwrap().unix_timestamp as u32
        });
    }
    Ok(())
}
