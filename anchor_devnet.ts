import BN from "bn.js";
import assert from "assert";
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
const SOLANA = require("@solana/web3.js");
const { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } = SOLANA;
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import * as anchor from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import type { TokenPresale } from "../target/types/token_presale";
import walletLists from "./wallets.json";
import env from "dotenv";

env.config();
const connection = anchor.getProvider().connection;
// const connection = new Connection(clusterApiUrl("localnet"), "confirmed");
const wallet = NodeWallet.local();
anchor.setProvider(new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" }));
const provider = anchor.getProvider();


const SOL_VAULT_SEED = "presale-escrow-vault";
const ADMIN_MANAGE_SEED = "admin-role";
const USER_ACCOUNT_SEED = "user-role";
const PRESALE_INFO_SEED = "presale-info";
const TOKEN_VAULT_SEED = "token-vault";

const ADMIN_WALLET_ADDRESS_STRING = wallet.publicKey.toString();
const ADMIN_WALLET_ADDRESS_PUB_KEY = new PublicKey(ADMIN_WALLET_ADDRESS_STRING);
console.log("This is the wallet", ADMIN_WALLET_ADDRESS_STRING);

let newToken: web3.PublicKey;
let tokenAccount: web3.PublicKey;
let tokenVault: web3.PublicKey;
let adminAccount: web3.PublicKey;
let escrowAccount: web3.PublicKey;
let presaleAccount: web3.PublicKey;
let userAccount: web3.PublicKey;
let teamWallet = web3.Keypair.fromSecretKey(bs58.decode(process.env.TEAM_WALLET_PRIVATE_KEY));
let buyer1Wallet = web3.Keypair.fromSecretKey(bs58.decode(process.env.BUYER_1_PRIVATE_KEY));
let buyer2Wallet = web3.Keypair.fromSecretKey(bs58.decode(process.env.BUYER_2_PRIVATE_KEY));
let buyer3Wallet = web3.Keypair.fromSecretKey(bs58.decode(process.env.BUYER_3_PRIVATE_KEY));
console.log("Team wallet public key is : ", teamWallet.publicKey.toString());
console.log("Buyer1 wallet public key is : ", buyer1Wallet.publicKey.toString());
console.log("Buyer2 wallet public key is : ", buyer2Wallet.publicKey.toString());
console.log("Buyer3 wallet public key is : ", buyer3Wallet.publicKey.toString());

const program = anchor.workspace.TokenPresale as anchor.Program<TokenPresale>;

// describe("Preparing SOL to Team Wallet", () => {
//   // Configure the client to use the local cluster
//   const AIRDROP_AMOUNT = 1 * LAMPORTS_PER_SOL; // 1 SOL

//   it("Airdroping 1 SOL to Team wallet", async () => {
//     // Airdrop 2 SOL to the admin account
//     console.log(
//       `Requesting airdrop for Team wallet - ${teamWallet.publicKey.toString()}`
//     );
//     const signature = await SOLANA_CONNECTION.requestAirdrop(
//       teamWallet.publicKey,
//       AIRDROP_AMOUNT
//     );
//     const { blockhash, lastValidBlockHeight } =
//       await SOLANA_CONNECTION.getLatestBlockhash();
//     await SOLANA_CONNECTION.confirmTransaction(
//       {
//         blockhash,
//         lastValidBlockHeight,
//         signature,
//       },
//       "finalized"
//     );
//     console.log(
//       `Airdrop complete with Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`
//     );
//     assert.ok(signature);
//   });

//   it("Airdroping 1 SOL to Buyer 1 wallet to simulate buying token", async () => {
//     // Airdrop 1 SOL to the admin account
//     console.log(
//       `Requesting airdrop for buyer dummy wallet - ${buyer1Wallet.publicKey.toString()}`
//     );
//     const signature = await SOLANA_CONNECTION.requestAirdrop(
//       buyer1Wallet.publicKey,
//       AIRDROP_AMOUNT
//     );
//     const { blockhash, lastValidBlockHeight } =
//       await SOLANA_CONNECTION.getLatestBlockhash();
//     await SOLANA_CONNECTION.confirmTransaction(
//       {
//         blockhash,
//         lastValidBlockHeight,
//         signature,
//       },
//       "finalized"
//     );
//     console.log(
//       `Airdrop complete with Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`
//     );
//     assert.ok(signature);
//   })
//   it("Airdroping 1 SOL to Buyer 2 wallet to simulate buying token", async () => {
//     // Airdrop 1 SOL to the admin account
//     console.log(
//       `Requesting airdrop for buyer dummy wallet - ${buyer2Wallet.publicKey.toString()}`
//     );
//     const signature = await SOLANA_CONNECTION.requestAirdrop(
//       buyer2Wallet.publicKey,
//       AIRDROP_AMOUNT
//     );
//     const { blockhash, lastValidBlockHeight } =
//       await SOLANA_CONNECTION.getLatestBlockhash();
//     await SOLANA_CONNECTION.confirmTransaction(
//       {
//         blockhash,
//         lastValidBlockHeight,
//         signature,
//       },
//       "finalized"
//     );
//     console.log(
//       `Airdrop complete with Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`
//     );
//     assert.ok(signature);
//   })
//   it("Airdroping 1 SOL to Buyer 3 wallet to simulate buying token", async () => {
//     // Airdrop 1 SOL to the admin account
//     console.log(
//       `Requesting airdrop for buyer dummy wallet - ${buyer3Wallet.publicKey.toString()}`
//     );
//     const signature = await SOLANA_CONNECTION.requestAirdrop(
//       buyer3Wallet.publicKey,
//       AIRDROP_AMOUNT
//     );
//     const { blockhash, lastValidBlockHeight } =
//       await SOLANA_CONNECTION.getLatestBlockhash();
//     await SOLANA_CONNECTION.confirmTransaction(
//       {
//         blockhash,
//         lastValidBlockHeight,
//         signature,
//       },
//       "finalized"
//     );
//     console.log(
//       `Airdrop complete with Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`
//     );
//     assert.ok(signature);
//   })
//   it("Airdroping 1 SOL to escrow wallet to simulate buying token", async () => {
//     // Airdrop 1 SOL to the escrow account
//     console.log(
//       `Requesting airdrop for buyer dummy wallet - ${buyer1Wallet.publicKey.toString()}`
//     );
//     [escrowAccount] = web3.PublicKey.findProgramAddressSync(
//       [Buffer.from(SOL_VAULT_SEED)],
//       program.programId
//     );
//     const signature = await SOLANA_CONNECTION.requestAirdrop(
//       escrowAccount,
//       AIRDROP_AMOUNT
//     );
//     const { blockhash, lastValidBlockHeight } =
//       await SOLANA_CONNECTION.getLatestBlockhash();
//     await SOLANA_CONNECTION.confirmTransaction(
//       {
//         blockhash,
//         lastValidBlockHeight,
//         signature,
//       },
//       "finalized"
//     );
//     console.log(
//       `Airdrop complete with Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`
//     );
//     assert.ok(signature);
//   })
// });

describe("Initialize Presale Vault with the Token", () => {

  it("Initialize the Presale Vault", async () => {
    // Create a new SPL token
    newToken = await token.createMint(
      anchor.getProvider().connection,
      wallet.payer,
      ADMIN_WALLET_ADDRESS_PUB_KEY,
      null,
      9
    );
    console.log("SPL Token address", newToken.toString());

    // Mint 100 tokens to the admin account
    tokenAccount = await token.createAccount(
      anchor.getProvider().connection,
      wallet.payer,
      newToken,
      ADMIN_WALLET_ADDRESS_PUB_KEY,
      null,
      null,
      token.TOKEN_PROGRAM_ID
    );
    console.log("Associated token address for admin", tokenAccount.toString());

    // const ata = await getAssociatedTokenAddress(tokenAccount, receiveAddress);

    await token.mintTo(
      anchor.getProvider().connection,
      wallet.payer,
      newToken,
      tokenAccount,
      wallet.payer,
      100 * 10 ** 9,
      [],
      null,
      token.TOKEN_PROGRAM_ID
    );
    console.log("Minted tokens successfully");
    let tokenAmount = await anchor.getProvider().connection.getTokenAccountBalance(tokenAccount);
    console.log("🚀 token balance in admin wallet is :", tokenAmount);

    [tokenVault] = web3.PublicKey.findProgramAddressSync(
      [newToken.toBuffer(), Buffer.from(TOKEN_VAULT_SEED)],
      program.programId
    );
    [adminAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(ADMIN_MANAGE_SEED), ADMIN_WALLET_ADDRESS_PUB_KEY.toBuffer()],
      program.programId
    );
    [escrowAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(SOL_VAULT_SEED)],
      program.programId
    );
    [presaleAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(PRESALE_INFO_SEED)],
      program.programId
    );

    const tx = await program.methods
      .initialize(
        1000,
        new BN(100),
        new BN(10 * LAMPORTS_PER_SOL),
        new BN(86400),
        new BN(50 * 10 ** 9),
        5000,
        2500,
      )
      .accounts({
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        tokenMint: newToken,
        tokenVault: tokenVault,
        adminAccount: adminAccount,
        escrowAccount: escrowAccount,
        presaleAccount: presaleAccount,
        systemProgram: web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: token.TOKEN_PROGRAM_ID,
      })
      .signers([])
      .transaction();

    console.log(await anchor.getProvider().connection.simulateTransaction(tx, [wallet.payer]));

    const txHash = await program.methods
      .initialize(
        1000,
        new BN(100),
        new BN(10 * LAMPORTS_PER_SOL),
        new BN(86400),
        new BN(100 * 10 ** 9),
        5000,
        2500,
      )
      .accounts({
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        tokenMint: newToken,
        tokenVault: tokenVault,
        adminAccount: adminAccount,
        escrowAccount: escrowAccount,
        presaleAccount: presaleAccount,
        systemProgram: web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: token.TOKEN_PROGRAM_ID,
      })
      .signers([])
      .rpc();

    // Confirm transaction
    const confirmation = await anchor
      .getProvider()
      .connection.confirmTransaction(txHash);
    console.log(
      `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
    );

    const fetchedAdminAccount =
      await program.account.adminAccount.fetch(adminAccount);
    console.log(fetchedAdminAccount);
    assert.ok(fetchedAdminAccount);

    // Log the completion of the initialization
    console.log("Initialization completed successfully");

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });

  it("Deposit 50% of token to token vault for presale", async () => {
    const txHash = await program.methods.depositToken(
      newToken,
      new BN(50 * 10 ** 9)
    )
      .accounts({
        tokenMint: newToken,
        tokenFrom: tokenAccount,
        tokenVault: tokenVault,
        adminAccount: adminAccount,
        presaleAccount: presaleAccount,
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        tokenProgram: token.TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([])
      .rpc();

    const confirmation = await anchor
      .getProvider()
      .connection.confirmTransaction(txHash);
    console.log(
      `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
    );

    let tokenAmount = await anchor.getProvider().connection.getTokenAccountBalance(tokenAccount);
    let tokenVaultBalance = await anchor.getProvider().connection.getTokenAccountBalance(tokenVault);
    console.log("🚀 After initialization, token balance in admin wallet is :", tokenAmount.value.uiAmount);
    console.log("🚀 And tokenVaultBalance:", tokenVaultBalance.value.uiAmount);

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });
});

describe("Add whitelist of buyer1Wallet and 5 other wallet, and simulate 3 wallet remove from whitelist", () => {

  it("Add Whilelist for buyer1Wallet - to simulate buying token from user.", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyer1Wallet.publicKey.toBuffer()],
      program.programId
    );
    const txHash = await program.methods
      .addWhitelist()
      .accounts({
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        adminAccount: adminAccount,
        presaleAccount: presaleAccount,
        userAccount: userAccount,
        authority: buyer1Wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([])
      .rpc();

    // Confirm transaction
    const confirmation = await anchor
      .getProvider()
      .connection.confirmTransaction(txHash);
    console.log(
      `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
    );

    const fetchedPresaleAccount =
      await program.account.presaleAccount.fetch(presaleAccount);
    console.log("The number of whitelist is ", fetchedPresaleAccount.totalWhitelistedWallets);
    assert.ok(fetchedPresaleAccount);

    const fetchedUserAccount =
      await program.account.userAccount.fetch(userAccount);
    console.log(fetchedUserAccount);
    assert.ok(fetchedUserAccount);

    // Log the completion of the initialization
    console.log("Adding whitelist completed successfully");

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });
  it("Add Whilelist for buyer2Wallet - to simulate buying token from user.", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyer2Wallet.publicKey.toBuffer()],
      program.programId
    );
    const txHash = await program.methods
      .addWhitelist()
      .accounts({
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        adminAccount: adminAccount,
        presaleAccount: presaleAccount,
        userAccount: userAccount,
        authority: buyer2Wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([])
      .rpc();

    // Confirm transaction
    const confirmation = await anchor
      .getProvider()
      .connection.confirmTransaction(txHash);
    console.log(
      `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
    );

    const fetchedPresaleAccount =
      await program.account.presaleAccount.fetch(presaleAccount);
    console.log("The number of whitelist is ", fetchedPresaleAccount.totalWhitelistedWallets);
    assert.ok(fetchedPresaleAccount);

    const fetchedUserAccount =
      await program.account.userAccount.fetch(userAccount);
    console.log(fetchedUserAccount);
    assert.ok(fetchedUserAccount);

    // Log the completion of the initialization
    console.log("Adding whitelist completed successfully");

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });
  it("Add Whilelist for buyer3Wallet - to simulate buying token from user.", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyer3Wallet.publicKey.toBuffer()],
      program.programId
    );
    const txHash = await program.methods
      .addWhitelist()
      .accounts({
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        adminAccount: adminAccount,
        presaleAccount: presaleAccount,
        userAccount: userAccount,
        authority: buyer3Wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([])
      .rpc();

    // Confirm transaction
    const confirmation = await anchor
      .getProvider()
      .connection.confirmTransaction(txHash);
    console.log(
      `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
    );

    const fetchedPresaleAccount =
      await program.account.presaleAccount.fetch(presaleAccount);
    console.log("The number of whitelist is ", fetchedPresaleAccount.totalWhitelistedWallets);
    assert.ok(fetchedPresaleAccount);

    const fetchedUserAccount =
      await program.account.userAccount.fetch(userAccount);
    console.log(fetchedUserAccount);
    assert.ok(fetchedUserAccount);

    // Log the completion of the initialization
    console.log("Adding whitelist completed successfully");

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });

  it("Add 5 others whilelist wallets", async () => {
    for (let i = 0; i < 5; i++) {
      [userAccount] = web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(USER_ACCOUNT_SEED),
          new web3.PublicKey(walletLists[i]).toBuffer(),
        ],
        program.programId
      );
      const txHash = await program.methods
        .addWhitelist()
        .accounts({
          admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
          adminAccount: adminAccount,
          presaleAccount: presaleAccount,
          userAccount: userAccount,
          authority: new web3.PublicKey(walletLists[i]),
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([])
        .rpc();

      // Confirm transaction
      const confirmation = await anchor
        .getProvider()
        .connection.confirmTransaction(txHash);
      console.log(
        `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
      );

      const fetchedPresaleAccount =
        await program.account.presaleAccount.fetch(presaleAccount);
      console.log("The number of whitelist is ", fetchedPresaleAccount.totalWhitelistedWallets);
      assert.ok(fetchedPresaleAccount);

      const fetchedUserAccount =
        await program.account.userAccount.fetch(userAccount);
      console.log(fetchedUserAccount);
      assert.ok(fetchedUserAccount);

      // Log the completion of the initialization
      console.log("Adding whitelist completed successfully");

      // Log the connection
      console.log(
        `Connected to ${anchor.getProvider().connection.rpcEndpoint}`
      );
    }
  });

  it("Remove 3 whitelisted wallets", async () => {
    for (let i = 0; i < 3; i++) {
      [userAccount] = web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(USER_ACCOUNT_SEED),
          new web3.PublicKey(walletLists[i]).toBuffer(),
        ],
        program.programId
      );
      const txHash = await program.methods
        .removeWhitelist()
        .accounts({
          admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
          adminAccount: adminAccount,
          presaleAccount: presaleAccount,
          userAccount: userAccount,
          authority: new web3.PublicKey(walletLists[i]),
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([])
        .rpc();

      // Confirm transaction
      const confirmation = await anchor
        .getProvider()
        .connection.confirmTransaction(txHash);
      console.log(
        `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
      );

      const fetchedPresaleAccount =
        await program.account.presaleAccount.fetch(presaleAccount);
      console.log("Now, the number of whitelist is ", fetchedPresaleAccount.totalWhitelistedWallets);
      assert.ok(fetchedPresaleAccount);

      const fetchedUserAccount =
        await program.account.userAccount.fetch(userAccount);
      console.log(fetchedUserAccount);
      assert.ok(fetchedUserAccount);

      // Log the completion of the removal
      console.log("Removing whitelist completed successfully");

      // Log the connection
      console.log(
        `Connected to ${anchor.getProvider().connection.rpcEndpoint}`
      );
    }
  });
})

describe("Buying tokens from buyer1Wallet, claim, and finalize", () => {
  it("Simulate Buying 10 tokens from buyer1Wallet", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyer1Wallet.publicKey.toBuffer()],
      program.programId
    );
    const txHash = await program.methods
      .buyToken(new BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({
        escrowAccount: escrowAccount,
        presaleAccount: presaleAccount,
        userAccount: userAccount,
        authority: buyer1Wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([buyer1Wallet])
      .rpc();

    // Confirm transaction
    const confirmation = await anchor
      .getProvider()
      .connection.confirmTransaction(txHash);
    // console.log(
    //   `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
    // );

    const fetchedPresaleAccount =
      await program.account.presaleAccount.fetch(presaleAccount);
    console.log("Total sol income has become ", Number(fetchedPresaleAccount.totalSolAmount));
    assert.ok(fetchedPresaleAccount);

    const fetchedUserAccount =
      await program.account.userAccount.fetch(userAccount);
    console.log(fetchedUserAccount);
    assert.ok(fetchedUserAccount);

    let tokenBoughtAllocation = await fetchedUserAccount.userBuyAmount
    let solPaid = await fetchedUserAccount.userSolContributed
    console.log("User bought: " + tokenBoughtAllocation.toNumber() / 10 ** 9 + " tokens");
    console.log("User paid: " + solPaid.toNumber() / 10 ** 9 + " SOL");
    // let tokenVaultBalance = await anchor.getProvider().connection.getTokenAccountBalance(tokenVault);
    // console.log("After user 1 buy 10 token VaultBalance:", tokenVaultBalance);

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });
  it("Simulate Buying 20 tokens from buyer2Wallet", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyer2Wallet.publicKey.toBuffer()],
      program.programId
    );
    const txHash = await program.methods
      .buyToken(new BN(0.2 * LAMPORTS_PER_SOL))
      .accounts({
        escrowAccount: escrowAccount,
        presaleAccount: presaleAccount,
        userAccount: userAccount,
        authority: buyer2Wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([buyer2Wallet])
      .rpc();

    // Confirm transaction
    const confirmation = await anchor
      .getProvider()
      .connection.confirmTransaction(txHash);
    // console.log(
    //   `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
    // );

    const fetchedPresaleAccount =
      await program.account.presaleAccount.fetch(presaleAccount);
    console.log("Total sol income has become ", Number(fetchedPresaleAccount.totalSolAmount));
    assert.ok(fetchedPresaleAccount);

    const fetchedUserAccount =
      await program.account.userAccount.fetch(userAccount);
    console.log(fetchedUserAccount);
    assert.ok(fetchedUserAccount);

    let tokenBoughtAllocation = await fetchedUserAccount.userBuyAmount
    let solPaid = await fetchedUserAccount.userSolContributed
    console.log("User bought: " + tokenBoughtAllocation.toNumber() / 10 ** 9 + " tokens");
    console.log("User paid: " + solPaid.toNumber() / 10 ** 9 + " SOL");
    // let tokenVaultBalance = await anchor.getProvider().connection.getTokenAccountBalance(tokenVault);
    // console.log("After user 2 buy 20 token VaultBalance:", tokenVaultBalance);

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });
  it("Simulate Buying 15 tokens from buyer3Wallet", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyer3Wallet.publicKey.toBuffer()],
      program.programId
    );
    const txHash = await program.methods
      .buyToken(new BN(0.15 * LAMPORTS_PER_SOL))
      .accounts({
        escrowAccount: escrowAccount,
        presaleAccount: presaleAccount,
        userAccount: userAccount,
        authority: buyer3Wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([buyer3Wallet])
      .rpc();

    // Confirm transaction
    const confirmation = await anchor
      .getProvider()
      .connection.confirmTransaction(txHash);

    const fetchedPresaleAccount =
      await program.account.presaleAccount.fetch(presaleAccount);
    console.log("Total sol income has become ", Number(fetchedPresaleAccount.totalSolAmount));
    assert.ok(fetchedPresaleAccount);

    const fetchedUserAccount =
      await program.account.userAccount.fetch(userAccount);
    console.log(fetchedUserAccount);
    assert.ok(fetchedUserAccount);

    let tokenBoughtAllocation = await fetchedUserAccount.userBuyAmount
    let solPaid = await fetchedUserAccount.userSolContributed
    console.log("User bought: " + tokenBoughtAllocation.toNumber() / 10 ** 9 + " tokens");
    console.log("User paid: " + solPaid.toNumber() / 10 ** 9 + " SOL");
    // let tokenVaultBalance = await anchor.getProvider().connection.getTokenAccountBalance(tokenVault);
    // console.log("After user 3 buy 15 token VaultBalance:", tokenVaultBalance);

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });
  it("Simulate Buying 50 tokens from buyer1Wallet and it should be failing because vault only have 50 total tokens", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyer1Wallet.publicKey.toBuffer()],
      program.programId
    );

    try {
      const txHash = await program.methods
        .buyToken(new BN(0.5 * LAMPORTS_PER_SOL))
        .accounts({
          escrowAccount: escrowAccount,
          presaleAccount: presaleAccount,
          userAccount: userAccount,
          authority: buyer1Wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([buyer1Wallet])
        .rpc();

      // Confirm transaction
      const confirmation = await anchor
        .getProvider()
        .connection.confirmTransaction(txHash);
      console.log(
        `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
      );

      const fetchedUserAccount =
        await program.account.userAccount.fetch(userAccount);
      console.log(fetchedUserAccount);
      assert.ok(fetchedUserAccount);

      let tokenBoughtAllocation = fetchedUserAccount.userBuyAmount;
      console.log("User bought: " + tokenBoughtAllocation.toNumber() / 10 ** 9 + " tokens");
      let solPaid = fetchedUserAccount.userSolContributed;
      console.log("User paid: " + solPaid.toNumber() / 10 ** 9 + " SOL");
      let tokenVaultBalance = await anchor.getProvider().connection.getTokenAccountBalance(tokenVault);
      console.log("🚀 And tokenVaultBalance:", tokenVaultBalance);
      // If the buyToken call doesn't throw an error, fail the test
      assert.fail("User can't buy because it exceeded the token in vault!");
    } catch (error) {
      console.log("This is the error", error.error);
      const fetchedUserAccount =
        await program.account.userAccount.fetch(userAccount);
      console.log(fetchedUserAccount);
    }

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });
})

// describe("Cancel presale, and buying tokens from buyer1Wallet once presale is cancelled and it should Error from Smart Contract", () => {
//   it("Cancel Presale", async () => {
//     const txHash = await program.methods
//       .cancelPresale()
//       .accounts({
//         admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
//         adminAccount: adminAccount,
//         presaleAccount: presaleAccount,
//         systemProgram: web3.SystemProgram.programId,
//       })
//       .signers([])
//       .rpc();

//     // Confirm transaction
//     const confirmation = await anchor
//       .getProvider()
//       .connection.confirmTransaction(txHash);
//     console.log(
//       `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
//     );

//     const fetchedPresaleAccount =
//       await program.account.presaleAccount.fetch(presaleAccount);
//     console.log(fetchedPresaleAccount);
//     assert.ok(fetchedPresaleAccount);

//     // Log the completion of cancel presale
//     console.log("Presale are cancelled");

//     // Log the connection
//     console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
//   })

//   it("Simulate Buying tokens from buyer1Wallet once presale is cancelled and it should not proceed", async () => {
//     [userAccount] = web3.PublicKey.findProgramAddressSync(
//       [Buffer.from(USER_ACCOUNT_SEED), buyer1Wallet.publicKey.toBuffer()],
//       program.programId
//     );
//     try {
//       await program.methods
//         .buyToken(new BN(10))
//         .accounts({
//           escrowAccount: escrowAccount,
//           presaleAccount: presaleAccount,
//           userAccount: userAccount,
//           authority: buyer1Wallet.publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .signers([buyer1Wallet])
//         .rpc();
//       // If the buyToken call doesn't throw an error, fail the test
//       assert.fail("Expected an error but call succeeded");
//     } catch (error) {
//       console.log("This is the error", error.error);
//       const fetchedUserAccount =
//         await program.account.userAccount.fetch(userAccount);
//       console.log(fetchedUserAccount);
//     }
//   })
// })

// describe("Check if the presale is cancelled and can refund token", () => {
//   it("Check if the presale is cancelled and can refund token", async () => {

//     [userAccount] = web3.PublicKey.findProgramAddressSync(
//       [Buffer.from(USER_ACCOUNT_SEED), buyer1Wallet.publicKey.toBuffer()],
//       program.programId
//     );
//     [adminAccount] = web3.PublicKey.findProgramAddressSync(
//       [Buffer.from(ADMIN_MANAGE_SEED), wallet.publicKey.toBuffer()],
//       program.programId
//     );
//     const fetchedPresaleAccount =
//       await program.account.presaleAccount.fetch(presaleAccount);
//     console.log(fetchedPresaleAccount);
//     assert.ok(fetchedPresaleAccount);

//     if (fetchedPresaleAccount.isCancelled !== 1) {
//       throw new Error("Presale is not cancelled");
//     } else {
//       console.log("Presale is cancelled, User can proceed refund");
//     }

//     const fetchedUserAccount =
//       await program.account.userAccount.fetch(userAccount);
//     console.log(fetchedUserAccount);
//     assert.ok(fetchedUserAccount);
//   })
// })

describe("Finalize token presale", () => {
  it("Finalize and send team percent of sol to team wallet", async () => {

    let fetchedPresaleAccount =
      await program.account.presaleAccount.fetch(presaleAccount);
    console.log(fetchedPresaleAccount);
    assert.ok(fetchedPresaleAccount);

    const connection = anchor.getProvider().connection;

    let teamWalletBalance = await connection.getBalance(teamWallet.publicKey);
    let escrowBalance = await connection.getBalance(escrowAccount);
    let teamBalanceInSol = teamWalletBalance / 10 ** 9;
    let escrowBalanceInSol = escrowBalance / 10 ** 9;

    console.log("Before finalization");
    console.log(`Team wallet has ${teamBalanceInSol}sol, escrow account has ${escrowBalanceInSol}sol.`);

    const txHash = await program.methods.finalize(0)
      .accounts({
        escrowAccount: escrowAccount,
        presaleAccount: presaleAccount,
        teamAccount: teamWallet.publicKey,
        adminAccount: adminAccount,
        // admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        // systemProgram: web3.SystemProgram.programId
      })
      .signers([wallet.payer])
      .transaction();

    // console.log(await connection.simulateTransaction(txHash, [wallet.payer]));
    txHash.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    txHash.feePayer = wallet.publicKey;

    const signature = await web3.sendAndConfirmTransaction(connection, txHash, [wallet.payer]);
    console.log("Finalize step success, cause presale hardcapped, even before the end time ===>", signature);

    let fetchedProfit = (await program.account.presaleAccount.fetch(presaleAccount))
      .totalSolAmount.toNumber() / 10 ** 9;
    console.log("Total profit : ", fetchedProfit);

    fetchedPresaleAccount = await program.account.presaleAccount.fetch(presaleAccount);
    console.log(fetchedPresaleAccount);

    teamWalletBalance = await connection.getBalance(teamWallet.publicKey);
    escrowBalance = await connection.getBalance(escrowAccount);
    teamBalanceInSol = teamWalletBalance / 10 ** 9;
    escrowBalanceInSol = escrowBalance / 10 ** 9;

    console.log("After transferring 10% sol to team wallet");
    console.log(`Team wallet now has ${teamBalanceInSol}sol, escrow account has ${escrowBalanceInSol}sol.`);
  })
})

// describe("Refund token after presale is cancelled", () => {
//   it("Get all users to refund and refund sol they paid", async () => {
//     [presaleAccount] = web3.PublicKey.findProgramAddressSync(
//       [Buffer.from(PRESALE_INFO_SEED)],
//       program.programId
//     );
//     const allUsers = await anchor.getProvider().connection.getProgramAccounts(
//       program.programId,
//       {
//         filters: [
//           { dataSize: 58 }
//         ]
//       });

//     for (let i = 0; i < allUsers.length; i++) {
//       const user = allUsers[i];
//       const fetchedUserAccount = await program.account.userAccount.fetch(user.pubkey);
//       console.log("fetchedUserAccount, ", fetchedUserAccount);
//       if (fetchedUserAccount.userSolContributed > new BN(0)) {
//         [escrowAccount] = web3.PublicKey.findProgramAddressSync(
//           [Buffer.from(SOL_VAULT_SEED)],
//           program.programId
//         );

//         // verify the balances
//         let userBalance = await anchor.getProvider().connection.getBalance(fetchedUserAccount.publicKey);
//         let escrowBalance = await anchor.getProvider().connection.getBalance(escrowAccount);
//         let userBalanceInSol = userBalance / 10 ** 9;
//         let escrowBalanceInSol = escrowBalance / 10 ** 9;

//         console.log("Before refund: ")
//         console.log(`Balance in user account is ${userBalanceInSol}sol, escrow account has ${escrowBalanceInSol}sol.`);

//         const txHash = await program.methods.refundToken()
//           .accounts({
//             escrowAccount: escrowAccount,
//             presaleAccount: presaleAccount,
//             authority: ADMIN_WALLET_ADDRESS_PUB_KEY,
//             userAccount: user.pubkey,
//             userToRefund: fetchedUserAccount.publicKey
//           })
//           .signers([])
//           .transaction();

//         // console.log(await anchor.getProvider().connection.simulateTransaction(txHash, [wallet.payer]));
//         const provider = anchor.getProvider();

//         txHash.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
//         txHash.feePayer = wallet.publicKey;

//         const signature = await web3.sendAndConfirmTransaction(provider.connection, txHash, [wallet.payer]);
//         console.log("signature ===>", signature);

//         // verify the balances
//         userBalance = await anchor.getProvider().connection.getBalance(fetchedUserAccount.publicKey);
//         escrowBalance = await anchor.getProvider().connection.getBalance(escrowAccount);
//         userBalanceInSol = userBalance / 10 ** 9;
//         escrowBalanceInSol = escrowBalance / 10 ** 9;
//         console.log("After refund: ")
//         console.log(`Balance in user account is ${userBalanceInSol}sol, escrow account has ${escrowBalanceInSol}sol.`);

//         const fetchedPresaleAccount =
//           await program.account.presaleAccount.fetch(presaleAccount);
//         console.log(fetchedPresaleAccount);
//         assert.ok(fetchedPresaleAccount);
//       }
//     }
//     // Log the connection
//     console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
//   });
// })

describe("Claim token when presale is successfully finished", () => {
  it("Fetch all user accounts who bought token and claim token", async () => {
    const accounts = await anchor.getProvider().connection.getProgramAccounts(
      program.programId,
      {
        filters: [
          { dataSize: 58 }
        ]
      });

    for (let account of accounts) {
      let userAccount = await program.account.userAccount.fetch(account.pubkey);
      //       console.log("🚀  userAccount:", userAccount)
      const userToSend = new web3.PublicKey(userAccount.publicKey);

      if (userAccount.isWhitelisted && userAccount.userBuyAmount.toNumber() > 0) {
        console.log("******************** is whitelisted and has bought tokens ********************")

        const userAta = await token.createAssociatedTokenAccount(
          anchor.getProvider().connection,
          wallet.payer,
          newToken,
          userToSend,
        )
        //         console.log("🚀  userAta:", userAta)

        try {
          const tx = await program.methods.claimToken()
            .accounts({
              tokenMint: newToken,
              tokenTo: userAta,
              tokenVault: tokenVault,
              presaleAccount: presaleAccount,
              userAccount: account.pubkey,
              userTo: userToSend,
              authority: ADMIN_WALLET_ADDRESS_PUB_KEY,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
              tokenProgram: token.TOKEN_PROGRAM_ID,
            })
            .signers([wallet.payer])
            .rpc();

          const confirmation = await anchor
            .getProvider()
            .connection.confirmTransaction(tx);
          console.log(
            `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
          );
          console.log("+======>");
        } catch (error) {
          assert.fail("Unexpected error: " + error.message);
        }

        // balance of user who claimed the token
        const userInfo = await anchor.getProvider().connection.getTokenAccountBalance(userAta);
        console.log('After claiming token the token balance of user: ', userInfo.value.uiAmount);

        // balance of token vault
        const vaultInfo = await anchor.getProvider().connection.getTokenAccountBalance(tokenVault);
        console.log('And balance of token vault became : ', vaultInfo.value.uiAmount);

        userAccount = await program.account.userAccount.fetch(account.pubkey);
        //         console.log("🚀  userAccount:", userAccount);
        assert.ok(userAccount);
      }
    }
  });
})

describe("Withdraw token", () => {
  it("Withdraw all remaining tokens from token vault to admin wallet", async () => {
    let bump: number;
    [tokenVault, bump] = web3.PublicKey.findProgramAddressSync(
      [newToken.toBuffer(), Buffer.from(TOKEN_VAULT_SEED)],
      program.programId
    );

    const connection = anchor.getProvider().connection;

    const mint = await token.getMint(connection, newToken);
    let vaultInfo = await token.getAccount(connection, tokenVault);
    let vaultAmount = Number(vaultInfo.amount);
    let vaultBalance = vaultAmount / (10 ** mint.decimals);
    console.log("__________ Before the token withdraw _________")
    console.log('Balance in token vault: ', vaultBalance);

    let tokenToInfo = await token.getAccount(connection, tokenAccount);
    let tokenToAmount = Number(tokenToInfo.amount);
    let adminTokenBalance = tokenToAmount / (10 ** mint.decimals);

    console.log('Balance in admin vault: ', adminTokenBalance);

    // let vaultInfo = await connection.getTokenAccountBalance(tokenVault);
    // let adminInfo = await connection.getTokenAccountBalance(adminAccount);
    // console.log("Before withdrawing token from token vault");
    // console.log('Balance in token vault: ', vaultInfo.value.uiAmount);
    // console.log('Balance in admin token account: ', adminInfo.value.uiAmount);

    const txHash = await program.methods.withdrawToken(bump)
      .accounts({
        tokenMint: newToken,
        tokenVault: tokenVault,
        tokenTo: tokenAccount,
        presaleAccount: presaleAccount,
        adminAccount: adminAccount,
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
      })
      .signers([wallet.payer])
      .transaction();

    // console.log(await connection.simulateTransaction(txHash, [wallet.payer]));
    txHash.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    txHash.feePayer = wallet.publicKey;

    const signature = await web3.sendAndConfirmTransaction(connection, txHash, [wallet.payer]);
    console.log("Withdrew token successfully ===>", signature);

    console.log("__________ After the token withdraw _________")
    vaultInfo = await token.getAccount(connection, tokenVault);
    vaultAmount = Number(vaultInfo.amount);
    vaultBalance = vaultAmount / (10 ** mint.decimals);

    console.log('Balance in token vault: ', vaultBalance);

    tokenToInfo = await token.getAccount(connection, tokenAccount);
    tokenToAmount = Number(tokenToInfo.amount);
    adminTokenBalance = tokenToAmount / (10 ** mint.decimals);

    console.log('Balance in admin vault: ', adminTokenBalance);
  })
})

describe("Withdraw SOL", () => {
  it("Withdraw remaining SOL in escrow account to admin wallet", async () => {
    const connection = anchor.getProvider().connection;
    let escrowBalance = await connection.getBalance(escrowAccount);
    let adminBalance = await connection.getBalance(wallet.publicKey);
    console.log("Before finalization");
    let adminBalanceInSol = adminBalance / 10 ** 9;
    let escrowBalanceInSol = escrowBalance / 10 ** 9;
    console.log(`Admin wallet has ${adminBalanceInSol}sol, escrow account has ${escrowBalanceInSol}sol.`);

    const txHash = await program.methods.withdraw()
      .accounts({
        escrowAccount: escrowAccount,
        presaleAccount: presaleAccount,
        adminAccount: adminAccount,
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        // systemProgram: web3.SystemProgram.programId
      })
      .signers([wallet.payer])
      .transaction();

    // console.log(await connection.simulateTransaction(txHash, [wallet.payer]));
    txHash.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    txHash.feePayer = wallet.publicKey;

    const signature = await web3.sendAndConfirmTransaction(connection, txHash, [wallet.payer]);
    console.log("Withdrew sol successfully ===>", signature);
    let fetchedProfit = ((await program.account.presaleAccount.fetch(presaleAccount)))
      .totalSolAmount.toNumber() / 10 ** 9;
    console.log("Total profit : ", fetchedProfit);

    adminBalance = await connection.getBalance(wallet.publicKey);
    escrowBalance = await connection.getBalance(escrowAccount);
    adminBalanceInSol = adminBalance / 10 ** 9;
    escrowBalanceInSol = escrowBalance / 10 ** 9;
    console.log("After transferring 10% sol to team wallet");
    console.log(`Admin wallet has ${adminBalanceInSol}sol, escrow account has ${escrowBalanceInSol}sol.`);
  })
})
