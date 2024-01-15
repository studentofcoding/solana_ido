import BN from "bn.js";
import assert from "assert";
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import base58 from "base58";
const SOLANA = require("@solana/web3.js");
const { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } = SOLANA;
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import * as anchor from "@coral-xyz/anchor";
import type { TokenPresale } from "../target/types/token_presale";
import walletLists from "./wallets.json";
const WALLET_SECRET_KEY = JSON.parse(require("fs").readFileSync(process.env.HOME + "/.config/solana/id.json", "utf8")).slice(0, 32);;
console.log("This is the Wallet Secret", WALLET_SECRET_KEY);
const walletAdmin = web3.Keypair.fromSeed(new Uint8Array(WALLET_SECRET_KEY));

const SOL_VAULT_SEED = "presale-escrow-vault";
const ADMIN_MANAGE_SEED = "admin-role";
const USER_ACCOUNT_SEED = "user-role";
const PRESALE_INFO_SEED = "presale-info";
const TOKEN_VAULT_SEED = "token-vault";

const wallet = NodeWallet.local();

// console.log("This is the Wallet Secret", wallet);
const ADMIN_WALLET_ADDRESS_STRING = wallet.publicKey.toString();
const ADMIN_WALLET_ADDRESS_PUB_KEY = new PublicKey(ADMIN_WALLET_ADDRESS_STRING);
console.log("This is the wallet", ADMIN_WALLET_ADDRESS_STRING);
const SOLANA_CONNECTION = new Connection("http://127.0.0.01:8899");
// const SOLANA_CONNECTION = new Connection("https://devnet.helius-rpc.com/?api-key=a632ca12-a781-4a5a-ab8a-d4314facfec7");

let newToken: web3.PublicKey;
let tokenAccount: web3.PublicKey;
let tokenVault: web3.PublicKey;
let adminAccount: web3.PublicKey;
let escrowAccount: web3.PublicKey;
let presaleAccount: web3.PublicKey;
let userAccount: web3.PublicKey;
// let teamWallet = web3.Keypair.fromSecretKey(base58.decode("EZht1RnKvKkiYhB9jUtdSpuui19j6Rj6YqnC1mX6AHd2sLwTpi6CjfHDw15KFeufDNoALs9ZZ3xz96gGn5br6k9"));
let teamWallet = web3.Keypair.generate();
let buyerDummyWallet = web3.Keypair.generate();
const program = anchor.workspace.TokenPresale as anchor.Program<TokenPresale>;

describe("Preparing SOL to Team Wallet", () => {
  // Configure the client to use the local cluster
  const AIRDROP_AMOUNT = 1 * LAMPORTS_PER_SOL; // 1 SOL

  // it("Airdroping 1 SOL to admin wallet", async () => {
  //   // Airdrop 2 SOL to the admin account
  //   console.log(
  //     `Requesting airdrop for admin wallet - ${ADMIN_WALLET_ADDRESS_STRING}`
  //   );
  //   const signature = await SOLANA_CONNECTION.requestAirdrop(
  //     ADMIN_WALLET_ADDRESS_PUB_KEY,
  //     AIRDROP_AMOUNT
  //   );
  //   const { blockhash, lastValidBlockHeight } =
  //     await SOLANA_CONNECTION.getLatestBlockhash();
  //   await SOLANA_CONNECTION.confirmTransaction(
  //     {
  //       blockhash,
  //       lastValidBlockHeight,
  //       signature,
  //     },
  //     "finalized"
  //   );
  //   console.log(
  //     `Airdrop complete with Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`
  //   );
  //   assert.ok(signature);
  // });

  it("Airdroping 1 SOL to Team wallet", async () => {
    // Airdrop 2 SOL to the admin account
    console.log(
      `Requesting airdrop for Team wallet - ${teamWallet.publicKey.toString()}`
    );
    const signature = await SOLANA_CONNECTION.requestAirdrop(
      teamWallet.publicKey,
      AIRDROP_AMOUNT
    );
    const { blockhash, lastValidBlockHeight } =
      await SOLANA_CONNECTION.getLatestBlockhash();
    await SOLANA_CONNECTION.confirmTransaction(
      {
        blockhash,
        lastValidBlockHeight,
        signature,
      },
      "finalized"
    );
    console.log(
      `Airdrop complete with Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
    assert.ok(signature);
  });

  it("Airdroping 1 SOL to Buyer Dummy wallet to simulate buying token", async () => {
    // Airdrop 1 SOL to the admin account
    console.log(
      `Requesting airdrop for buyer dummy wallet - ${buyerDummyWallet.publicKey.toString()}`
    );
    const signature = await SOLANA_CONNECTION.requestAirdrop(
      buyerDummyWallet.publicKey,
      AIRDROP_AMOUNT
    );
    const { blockhash, lastValidBlockHeight } =
      await SOLANA_CONNECTION.getLatestBlockhash();
    await SOLANA_CONNECTION.confirmTransaction(
      {
        blockhash,
        lastValidBlockHeight,
        signature,
      },
      "finalized"
    );
    console.log(
      `Airdrop complete with Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
    assert.ok(signature);
  })
});

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
      100,
      [],
      null,
      token.TOKEN_PROGRAM_ID
    );
    console.log("Minted tokens successfully");

    [tokenVault] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(TOKEN_VAULT_SEED), newToken.toBuffer()],
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

    const txHash = await program.methods
      .initialize()
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

  it("Initialize Presale parameters", async () => {
    const txHash = await program.methods
      // Initiialize parameter on Presale
      .updatePresaleDetails(new BN(100), new BN(10000), new BN(99999999999999))
      .accounts({
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        adminAccount: adminAccount,
        presaleAccount: presaleAccount,
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
    console.log(fetchedPresaleAccount);
    assert.ok(fetchedPresaleAccount);

    // Log the completion of the initialization
    console.log("Updating presale info completed successfully");

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });
});

describe("Add whitelist of buyerDummyWallet and 5 other wallet, and simulate 3 wallet remove from whitelist", () => {
  
  it("Add Whilelist for buyerDummyWallet - to simulate buying token from user.", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyerDummyWallet.publicKey.toBuffer()],
      program.programId
    );
    const txHash = await program.methods
      .addWhitelist()
      .accounts({
        admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
        adminAccount: adminAccount,
        presaleAccount: presaleAccount,
        userAccount: userAccount,
        authority: buyerDummyWallet.publicKey,
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
    console.log(fetchedPresaleAccount);
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
      console.log(fetchedPresaleAccount);
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
      console.log(fetchedPresaleAccount);
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

   // it("Remove Whilelist", async () => {
  //   [userAccount] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from(USER_ACCOUNT_SEED), teamWallet.publicKey.toBuffer()],
  //     program.programId
  //   );
  //   const txHash = await program.methods
  //     .removeWhitelist()
  //     .accounts({
  //       admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
  //       adminAccount: adminAccount,
  //       presaleAccount: presaleAccount,
  //       userAccount: userAccount,
  //       authority: teamWallet.publicKey,
  //       systemProgram: web3.SystemProgram.programId,
  //     })
  //     .signers([])
  //     .rpc();

  //   // Confirm transaction
  //   const confirmation = await anchor
  //     .getProvider()
  //     .connection.confirmTransaction(txHash);
  //   console.log(
  //     `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
  //   );

  //   const fetchedPresaleAccount =
  //     await program.account.presaleAccount.fetch(presaleAccount);
  //   console.log(fetchedPresaleAccount);
  //   assert.ok(fetchedPresaleAccount);

  //   const fetchedUserAccount =
  //     await program.account.userAccount.fetch(userAccount);
  //   console.log(fetchedUserAccount);
  //   assert.ok(fetchedUserAccount);

  //   // Log the completion of the initialization
  //   console.log("Removing whitelist completed successfully");

  //   // Log the connection
  //   console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  // });
})

describe("Buying tokens from buyerDummyWallet", () => {
  it("Simulate Buying tokens from buyerDummyWallet", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyerDummyWallet.publicKey.toBuffer()],
      program.programId
    );
    const txHash = await program.methods
      .buyToken(new BN(10))
      .accounts({
        escrowAccount: escrowAccount,
        presaleAccount: presaleAccount,
        userAccount: userAccount,
        authority: buyerDummyWallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([buyerDummyWallet])
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
    console.log(fetchedPresaleAccount);
    assert.ok(fetchedPresaleAccount);

    const fetchedUserAccount =
      await program.account.userAccount.fetch(userAccount);
    console.log(fetchedUserAccount);
    assert.ok(fetchedUserAccount);

    let tokenBoughtAllocation = await fetchedUserAccount.userBuyAmount
    let solPaid = await fetchedUserAccount.userSolContributed
    console.log("User bought: " + tokenBoughtAllocation.toNumber() + " tokens");
    console.log("User paid: " + solPaid.toNumber() + " SOL");

    // Log the connection
    console.log(`Connected to ${anchor.getProvider().connection.rpcEndpoint}`);
  });
});

describe("Cancel the Presale", () => {
  it("Cancel Presale", async () => {
    [presaleAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(PRESALE_INFO_SEED)],
      program.programId
    );
    [adminAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(ADMIN_MANAGE_SEED), wallet.publicKey.toBuffer()],
      program.programId
    );
    const fetchedPresaleAccount =
      await program.account.presaleAccount.fetch(presaleAccount);

      console.log(fetchedPresaleAccount);
    assert.ok(fetchedPresaleAccount);

    let usersBought = fetchedPresaleAccount.usersBought;

    for(let i = 0; i < usersBought.length; i++) {
      const userPubkey = new web3.PublicKey(usersBought[i]);
      [userAccount] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from(USER_ACCOUNT_SEED), userPubkey.toBuffer()],
        program.programId
      );

      const txHash = await program.methods
      .cancelPresale(new BN(usersBought.length), new BN(i))
      .accounts({
        presaleAccount,
        userAccount,
        escrowAccount,
        adminAccount,
        recipient: userPubkey,
        admin: buyerDummyWallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([buyerDummyWallet])
      .rpc();

    // Confirm transaction
    const confirmation = await anchor
      .getProvider()
      .connection.confirmTransaction(txHash);
    console.log(
      `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
    ); 
    }
    // const txHash = await program.methods
    //   .cancelPresale()
    //   .accounts({
    //     admin: ADMIN_WALLET_ADDRESS_PUB_KEY,
    //     adminAccount: adminAccount,
    //     presaleAccount: presaleAccount,
    //     systemProgram: web3.SystemProgram.programId,
    //   })
    //   .signers([])
    //   .rpc();

    // // Confirm transaction
    // const confirmation = await anchor
    //   .getProvider()
    //   .connection.confirmTransaction(txHash);
    // console.log(
    //   `Transaction ${confirmation.value.err ? "failed" : "succeeded"}`
    // );

    // Log the completion of cancel presale
    console.log("Presale are cancelled");

  })
});

describe("Buying tokens from buyerDummyWallet once presale is cancelled and it should Error from Smart Contract", () => {
  it("Simulate Buying tokens from buyerDummyWallet once presale is cancelled and it should not proceed", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyerDummyWallet.publicKey.toBuffer()],
      program.programId
    );
    try {
      await program.methods
        .buyToken(new BN(10))
        .accounts({
          escrowAccount: escrowAccount,
          presaleAccount: presaleAccount,
          userAccount: userAccount,
          authority: buyerDummyWallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([buyerDummyWallet])
        .rpc();
      // If the buyToken call doesn't throw an error, fail the test
      assert.fail("Expected an error but call succeeded");
    } catch (error) {
      console.log("This is the error", error.error);
      const fetchedUserAccount =
      await program.account.userAccount.fetch(userAccount);
      console.log(fetchedUserAccount);

      let tokenBoughtAllocation = await fetchedUserAccount.userBuyAmount
      let solPaid = await fetchedUserAccount.userSolContributed
      console.log("User bought: " + tokenBoughtAllocation.toNumber() + " tokens");
      console.log("User paid: " + solPaid.toNumber() + " SOL");
      // Add assertion for the error number
      assert.equal(error.error.errorCode.number, 6005);
    }
  });
});

describe("Check if the presale is cancelled and can refund token", () => {
  it("Check if the presale is cancelled and can refund token", async () => {
    [userAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(USER_ACCOUNT_SEED), buyerDummyWallet.publicKey.toBuffer()],
      program.programId
    );
    [adminAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(ADMIN_MANAGE_SEED), wallet.publicKey.toBuffer()],
      program.programId
    );
    const fetchedPresaleAccount =
    await program.account.presaleAccount.fetch(presaleAccount);
    console.log(fetchedPresaleAccount);
    assert.ok(fetchedPresaleAccount);

    if (fetchedPresaleAccount.isCancelled !== 1) {
      throw new Error("Presale is not cancelled");
    } else {
      console.log("Presale is cancelled, User can proceed refund");
    }

    const fetchedUserAccount =
      await program.account.userAccount.fetch(userAccount);
    console.log(fetchedUserAccount);
    assert.ok(fetchedUserAccount);
  })
})