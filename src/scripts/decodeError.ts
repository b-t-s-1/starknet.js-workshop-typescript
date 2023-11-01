// decode a string from Starknet
// use Starknet.js v5.13.1, starknet-devnet 0.5.3
// launch with npx ts-node src/scripts/decodeError.tsdeclareAndDeployConstructor2.ts

import { shortString } from "starknet";


function main() {
    console.log("Decoded message =", shortString.decodeShortString("0x496e70757420746f6f206c6f6e6720666f7220617267756d656e7473"));
    console.log("Decoded message =", shortString.decodeShortString("0x0517ececd29116499f4a1b64b094da79ba08dfd54a3edaa316134c41f8160973"));
} 
main();

// Result : 
// "0x496e70757420746f6f206c6f6e6720666f7220617267756d656e7473" = Input too long for arguments
// "0x617267656e742f696e76616c69642d6f776e65722d736967" = argent/invalid-owner-sig
