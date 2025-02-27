// test in testnet/rpc0.5.0 a contract that can be rejected.
// launch with npx ts-node src/scripts/cairo12/cairo12-testnet/6.testTxResponse.ts
// Coded with Starknet.js v5.23.0

import { constants, Contract, Account, json, shortString, RpcProvider, encode } from "starknet";
import { account2TestnetAddress, account2TestnetPrivateKey } from "../../../A1priv/A1priv";

import fs from "fs";
import { LogC } from "../../utils/logColors"
import * as dotenv from "dotenv";
import { alchemyKey, blastKey, infuraKey, lavaMainnetKey } from "../../../A-MainPriv/mainPriv";
dotenv.config();

declare enum StarknetChainId {
    SN_MAIN = "0x534e5f4d41494e",
    SN_GOERLI = "0x534e5f474f45524c49",
    SN_SEPOLIA = "0x534e5f5345504f4c4941",
}

async function testProvider(providerUrl: string): Promise<string> {
    const provider = new RpcProvider({ nodeUrl: providerUrl });
    let chId: StarknetChainId;
    let result: string = "*** " + providerUrl;

    try {
        chId = await provider.getChainId();
        if (chId) {
            result = result + LogC.fg.green + "\nProvider is working fine." + LogC.reset;
            try {
                const resp = await provider.getSpecVersion();
                result = result + "\nThis provider use a rpc version " + resp;
            } catch {
                result = result + "\nThis provider use a rpc version 0.4.0 or older.";
            }
        } else {
            result = result + LogC.fg.red + "\nThis provider is not working properly." + LogC.reset;
        }
    } catch {
        result = result + LogC.fg.red + "\nThis provider is not working properly." + LogC.reset;
    }
    return result;
}

async function main() {

    // defaul node
    const provider = new RpcProvider();
    const chId = shortString.decodeShortString(await provider.getChainId());
    const resp = await provider.getSpecVersion();
    console.log("default =", chId, resp);

    const listProvider = [
        constants.NetworkName.SN_GOERLI, // default Testnet
        constants.NetworkName.SN_MAIN, // default Testnet

        //sepolia testnet
        "https://starknet-sepolia.public.blastapi.io/rpc/v0.5",
        "https://starknet-sepolia.public.blastapi.io/rpc/v0_6",
        "https://free-rpc.nethermind.io/sepolia-juno",
        "https://free-rpc.nethermind.io/sepolia-juno/v0_5",
        // goerli testnet
        "https://starknet-goerli.g.alchemy.com/v2/" + alchemyKey,
        "https://starknet-goerli.g.alchemy.com/starknet/version/rpc/v0.5/" + alchemyKey,
        'https://starknet-goerli.infura.io/v3/' + infuraKey,
        'https://starknet-goerli.infura.io/rpc/v0.5/' + infuraKey,
        'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0.5",
        "https://starknet-testnet.public.blastapi.io/rpc/v0.4",
        "https://starknet-testnet.public.blastapi.io/rpc/v0.5",
        "https://limited-rpc.nethermind.io/goerli-juno",
        "https://free-rpc.nethermind.io/goerli-juno/v0_5",
        "https://json-rpc.starknet-testnet.public.lavanet.xyz",
        'http://192.168.1.44:9545/rpc/v0.4', //pathfinder 0.10.0
        'http://192.168.1.44:9545/rpc/v0_4', //pathfinder 0.10.0
        'http://192.168.1.44:9545/rpc/v0.5', //pathfinder 0.10.0
        'http://192.168.1.44:9545/rpc/v0_5', //pathfinder 0.10.0
        'http://192.168.1.44:9545/rpc/v0.6', //pathfinder 0.10.0
        'http://192.168.1.44:9545/rpc/v0_6', //pathfinder 0.10.0
        // mainnet
        "https://starknet-mainnet.g.alchemy.com/v2/" + alchemyKey,
        "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0.5/" + alchemyKey,
        "https://starknet-mainnet.infura.io/v3/" + infuraKey,
        'https://starknet-mainnet.infura.io/rpc/v0.5/' + infuraKey,
        "https://starknet-mainnet.blastapi.io/" + blastKey + "/rpc/v0.5",
        "https://starknet-mainnet.public.blastapi.io/rpc/v0.4",
        "https://starknet-mainnet.public.blastapi.io/rpc/v0.5",
        "https://limited-rpc.nethermind.io/mainnet-juno/v0_5",
        "https://free-rpc.nethermind.io/mainnet-juno/v0_5",
        "https://g.w.lavanet.xyz:443/gateway/strk/rpc-http/" + lavaMainnetKey,
        "https://json-rpc.starknet-mainnet.public.lavanet.xyz",
        "http://192.168.1.44:6060/v0_4", //Juno
        "http://192.168.1.44:6060/v0_5", //Juno
        "http://192.168.1.44:6060/v0_6", //Juno
    ]

    for (const url of listProvider) {
        console.log(await testProvider(url) + "\n");
    }

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


