
// call a Cairov2.1.0 contract, with Span.
// use Starknet.js v5.17.0, starknet-devnet 0.5.5
// launch with npx ts-node src/scripts/cairo13-devnet/3a.testSpan.ts

import { Provider, Account, Contract, json, Result, BigNumberish, Calldata, CallData, constants, Call, RawArgsObject, cairo, CairoEnum, CairoOption, CairoResult, Uint256, uint256, TypedContract } from "starknet";
import fs from "fs";
import { CairoCustomEnum } from "starknet";
import {myAbi} from "../../contracts/abis/hello_res_events_newTypes.abi";
import {mAbi} from "../../contracts/abis/merkle-abi";
import * as dotenv from "dotenv";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0
// launch script 3 before this script.
//          👆👆👆

type Order = {
  p1: BigNumberish,
  p2: BigNumberish,
}

async function main() {
  //initialize Provider 
  const provider = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5050" } });
  // const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI } });

  console.log('✅ Connected to devnet.');

  // initialize existing predeployed account 0 of Devnet
  const privateKey = "0xe3e70682c2094cac629f6fbed82c07cd";
  const accountAddress: string = "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a";
  const account0 = new Account(provider, accountAddress, privateKey);
  console.log('✅ Predeployed account connected\nOZ_ACCOUNT_ADDRESS=', account0.address);
  console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);


  // Connect the  contract instance :
  //          👇👇👇 update address in accordance with result of script 3
  const address = "0x3caac619d1b29b40b19035e6fb5dee942ccce1a3b21f75351f05ca780c89c08";
  const compiledTest = json.parse(fs.readFileSync("./compiledContracts/cairo210/hello_res_events_newTypes.sierra.json").toString("ascii"));
  const myTestContract = new Contract(compiledTest.abi, address, provider);
  myTestContract.connect(account0);
  
  //method 2
  const myContract= myTestContract.typed(mAbi);
  
  //method 1
  let cairo1Contract: TypedContract<typeof mAbi>;

  // await cairo1Contract.get_root();
  console.log('✅ Test Contract connected at =', myTestContract.address);

  const resSpan = await myContract.new_span([1, 2, 3]);
  console.log("resSpan =", resSpan);
  const resTypes = await myTestContract.new_types(100, 200, 300);
  console.log("resTypes =", resTypes);
  const resArr = await myTestContract.array_new_types(cairo.tuple(400, 500, 600), cairo.tuple([1, 2, 3], [10, 11, 12], [20, 21, 22]));
  console.log("resArr =", resArr);
  const compiled = myTestContract.populate('new_types', {
    ch: 123456789n,
    eth_addr: 987654321n,
    contr_address: 657563474357n,
  });
  console.log("populate =", compiled);

  const compiled2 = CallData.compile({
    ch: 123456789n,
    eth_addr: 987654321n,
    contr_address: 657563474357n,
  });
  console.log("compile =", compiled2);

  console.log('✅ Test completed.');

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });