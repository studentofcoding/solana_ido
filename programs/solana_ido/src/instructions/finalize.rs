use {anchor_lang::prelude::*, crate::errors::ErrorCode, crate::state::*};

#[derive(Accounts)]
pub struct Finalize<'info> {
    /// CHECK: This is vault account.
    #[account(
        mut,
        seeds = [ SOL_VAULT_SEED.as_bytes() ],
        bump,
    )]
    pub escrow_account: AccountInfo<'info>,
    /// CHECK: This is team account.
    #[account(mut)]
    //the team account to withdraw
    pub team_account: AccountInfo<'info>,
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
}

#[access_control(is_admin(&ctx.accounts.admin_account, &ctx.accounts.admin))]
pub fn handler(ctx: Context<Finalize>, forcible_finalize: u8) -> Result<()> {
    let presale_account = &mut ctx.accounts.presale_account;

    if forcible_finalize == 0 {
        if presale_account.end_time > Clock::get().unwrap().unix_timestamp as u64 && presale_account.is_hardcapped == 0 {
            return Err(error!(ErrorCode::PresaleNotFinished));
        }

        if presale_account.is_softcapped == 0 && presale_account.is_hardcapped == 0 {
            presale_account.is_cancelled = 1;
            msg!("Softcap not reached, so cancel the presale");
            // return Err(error!(ErrorCode::SoftCapNotReached));
        }
    }
    if presale_account.is_cancelled == 0 {
        let team_amount = (presale_account.team_percent as u64
            * presale_account.total_sol_amount
            / 10000) as u64;
        let amount = **ctx.accounts.escrow_account.lamports.borrow();
        if amount < team_amount {
            return Err(error!(ErrorCode::NoEnoughSol));
        }

        **ctx.accounts.escrow_account.try_borrow_mut_lamports()? -= team_amount;
        **ctx.accounts.team_account.try_borrow_mut_lamports()? += team_amount;

        presale_account.is_finalized = 1;

        emit!(PresaleFinalized {
            total_amount: presale_account.total_sol_amount,
            time_stamp: Clock::get().unwrap().unix_timestamp as u32
        });
    }
    Ok(())
}
