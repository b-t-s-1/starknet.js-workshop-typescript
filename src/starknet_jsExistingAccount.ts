// Deploy and use an ERC20, monetized by an existing account
// Launch with : npx ts-node src/starknet_jsExistingAccount.ts
// Coded with Starknet.js v5.19.5, Starknet-devnet-rs v0.1.0

import fs from "fs";
import { Account, Contract, defaultProvider, json, Provider, CallData, Calldata, Call, cairo, uint256, Uint256, RpcProvider } from "starknet";
import * as dotenv from "dotenv";
dotenv.config();

//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆

function formatBalance(qty: bigint, decimals: number): string {
    const balance = String("0").repeat(decimals) + qty.toString();
    const rightCleaned = balance.slice(-decimals).replace(/(\d)0+$/gm, '$1');
    const leftCleaned = BigInt(balance.slice(0, balance.length - decimals)).toString();
    return leftCleaned + "." + rightCleaned;
}

async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log("Account 0 connected.\n");

    // Deploy an ERC20 contract 
    console.log("Deployment Tx - ERC20 Contract to StarkNet...");

    // Constructor of the ERC20 Cairo 0 contract :
    // {
    //     "inputs": [
    //         {
    //             "name": "name",
    //             "type": "felt"
    //         },
    //         {
    //             "name": "symbol",
    //             "type": "felt"
    //         },
    //         {
    //             "name": "decimals",
    //             "type": "felt"
    //         },
    //         {
    //             "name": "initial_supply",
    //             "type": "Uint256"
    //         },
    //         {
    //             "name": "recipient",
    //             "type": "felt"
    //         },
    //         {
    //             "name": "owner",
    //             "type": "felt"
    //         }
    //     ],
    //     "name": "constructor",
    //     "outputs": [],
    //     "type": "constructor"
    // },

    const compiledErc20mintable = json.parse(fs.readFileSync("./compiledContracts/cairo060/ERC20MintableOZ_0_6_1.json").toString("ascii"));
    const DECIMALS = 18;

    // define the constructor :
    const initialTk: Uint256 = cairo.uint256(100);
    const erc20CallData: CallData = new CallData(compiledErc20mintable.abi);
    const ERC20ConstructorCallData: Calldata = erc20CallData.compile("constructor", {
        name: "niceToken",
        symbol: "NIT",
        decimals: DECIMALS,
        initial_supply: initialTk,
        recipient: account0.address,
        owner: account0.address
    });

    console.log("constructor=", ERC20ConstructorCallData);
    const deployERC20Response = await account0.declareAndDeploy({
        contract: compiledErc20mintable,
        constructorCalldata: ERC20ConstructorCallData
    });
    console.log("ERC20 declared hash: ", deployERC20Response.declare.class_hash);
    console.log("ERC20 deployed at address: ", deployERC20Response.deploy.contract_address);

    // Get the erc20 contract address
    const erc20Address = deployERC20Response.deploy.contract_address;
    // Create a new erc20 contract object
    const erc20 = new Contract(compiledErc20mintable.abi, erc20Address, provider);
    erc20.connect(account0);

    // Check balance - should be 100
    console.log(`Calling StarkNet for account balance...`);
    const balanceInitial = await erc20.balanceOf(account0.address);
    console.log("account0 has a balance of :", formatBalance(uint256.uint256ToBN(balanceInitial.balance), DECIMALS));

    // Mint 1000 tokens to account address
    const amountToMint = cairo.uint256(1000);
    console.log("Invoke Tx - Minting 1000 tokens to account0...");
    const { transaction_hash: mintTxHash } = await erc20.mint(account0.address, amountToMint, { maxFee: 900_000_000_000_000 }); // with Cairo 1 contract, 'amountToMint' can be replaced by '100n'
    // Wait for the invoke transaction to be accepted on StarkNet
    console.log(`Waiting for Tx to be Accepted on Starknet - Minting...`);
    await provider.waitForTransaction(mintTxHash);
    // Check balance - should be 1100
    console.log(`Calling StarkNet for account balance...`);
    const balanceBeforeTransfer = await erc20.balanceOf(account0.address);
    console.log("account0 has a balance of :", formatBalance(uint256.uint256ToBN(balanceBeforeTransfer.balance), DECIMALS));

    // Execute tx transfer of 2x10 tokens, showing 2 ways to write data in Starknet
    console.log(`Invoke Tx - Transfer 2x10 tokens back to erc20 contract...`);
    const toTransferTk: Uint256 = cairo.uint256(10);
    const transferCallData: Call = erc20.populate("transfer", {
        recipient: erc20Address,
        amount: toTransferTk // with Cairo 1 contract, 'toTransferTk' can be replaced by '10n'
    });
    const { transaction_hash: transferTxHash } = await account0.execute(transferCallData, undefined, { maxFee: 900_000_000_000_000 });
    await provider.waitForTransaction(transferTxHash);

    const { transaction_hash: transferTxHash2 } = await erc20.transfer(erc20Address, cairo.uint256(10));
    await provider.waitForTransaction(transferTxHash2);

    const { transaction_hash: transferTxHash3 } = await erc20.transfer(...transferCallData.calldata as string[], { parseRequest: false });
    // Wait for the invoke transactions to be accepted on StarkNet
    console.log(`Waiting for Tx to be Accepted on Starknet - Transfer...`);
    await provider.waitForTransaction(transferTxHash3);

    // Check balance after transfer - should be 1070
    console.log(`Calling StarkNet for account balance...`);
    const balanceAfterTransfer = await erc20.balanceOf(account0.address);
    console.log("account0 has a balance of :", formatBalance(uint256.uint256ToBN(balanceAfterTransfer.balance), DECIMALS));
    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });