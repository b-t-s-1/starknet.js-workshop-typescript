// Collection of functions for Braavos account creation
// coded with Starknet.js v5.11.1, 01/jun/2023

import { ec, hash, num, constants, Provider, CallData, stark, BigNumberish, } from "starknet";
import { type RawCalldata, type DeployContractResponse, type Calldata, type DeployAccountContractPayload, type EstimateFeeDetails, type CairoVersion, type InvocationsSignerDetails, type DeployAccountContractTransaction, } from "starknet";

const BraavosProxyClassHash: BigNumberish = "0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e";
const BraavosInitialClassHash = "0x5aa23d5bb71ddaa783da7ea79d405315bafa7cf0387a74f4593578c3e9e6570";
const BraavosAccountClassHash1 = "0x2c2b8f559e1221468140ad7b2352b1acvv5be32660d0bf1a3ae3a054a4ec5254e4"; // 03/jun/2023
const BraavosAccountClassHash = "0x0105c0cf7aadb6605c9538199797920884694b5ce84fc68f92c832b0c9f57ad9"; // 27/aug/2023, will probably change over time

export function getBraavosSignature(
    BraavosProxyAddress: num.BigNumberish,
    BraavosProxyConstructorCallData: RawCalldata,
    starkKeyPubBraavos: num.BigNumberish,
    version: bigint,
    max_fee: num.BigNumberish,
    chainId: constants.StarknetChainId,
    nonce: bigint,
    privateKeyBraavos: num.BigNumberish,
): string[] {
    const txnHash = hash.calculateDeployAccountTransactionHash(
        BraavosProxyAddress,
        BraavosProxyClassHash,
        BraavosProxyConstructorCallData,
        starkKeyPubBraavos,
        version,
        max_fee,
        chainId,
        nonce
    );
    console.log("inputHash =\n",
        BraavosProxyAddress,
        BraavosProxyClassHash,
        BraavosProxyConstructorCallData,
        starkKeyPubBraavos,
        version,
        max_fee,
        chainId,
        nonce
    )
    console.log("MshHash =",txnHash);

    const parsedOtherSigner = [0, 0, 0, 0, 0, 0, 0];
    const { r, s } = ec.starkCurve.sign(
        hash.computeHashOnElements([
            txnHash,
            BraavosAccountClassHash,
            ...parsedOtherSigner,
        ]),
        num.toHex(privateKeyBraavos),
    );
    const signature = [r.toString(), s.toString(), BraavosAccountClassHash.toString(), ...parsedOtherSigner.map(e => e.toString())];
    console.log("signature =", signature);
    return signature
}

const calcBraavosInit = (starkKeyPubBraavos: string) => CallData.compile({ public_key: starkKeyPubBraavos });
const BraavosProxyConstructor = (BraavosInitializer: Calldata) => CallData.compile({
    implementation_address: BraavosInitialClassHash,
    initializer_selector: hash.getSelectorFromName("initializer"),
    calldata: [...BraavosInitializer,]
});

export function calculateAddressBraavos(
    privateKeyBraavos: num.BigNumberish,
): string {
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const BraavosInitializer: Calldata = calcBraavosInit(starkKeyPubBraavos);
    const BraavosProxyConstructorCallData = BraavosProxyConstructor(BraavosInitializer);

    return hash.calculateContractAddressFromHash(
        starkKeyPubBraavos,
        BraavosProxyClassHash,
        BraavosProxyConstructorCallData,
        0);

}

async function buildBraavosAccountDeployPayload(
    privateKeyBraavos: num.BigNumberish,
    {
        classHash,
        addressSalt,
        constructorCalldata,
        contractAddress: providedContractAddress,
    }: DeployAccountContractPayload,
    { nonce, chainId, version, maxFee }: InvocationsSignerDetails
): Promise<DeployAccountContractTransaction> {
    const compiledCalldata = CallData.compile(constructorCalldata ?? []);
    const contractAddress =
        providedContractAddress ??
        calculateAddressBraavos(privateKeyBraavos);
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const signature = getBraavosSignature(
        contractAddress,
        compiledCalldata,
        starkKeyPubBraavos,
        BigInt(version),
        maxFee,
        chainId,
        BigInt(nonce),
        privateKeyBraavos,
    );
    return {
        classHash,
        addressSalt,
        constructorCalldata: compiledCalldata,
        signature,
    };
}

export async function estimateBraavosAccountDeployFee(
    privateKeyBraavos: num.BigNumberish,
    provider: Provider,
    { blockIdentifier, skipValidate }: EstimateFeeDetails = {}
): Promise<bigint> {
    const version = hash.feeTransactionVersion;
    const nonce = constants.ZERO;
    const chainId = await provider.getChainId();
    const cairoVersion: CairoVersion = "0";
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const BraavosProxyAddress = calculateAddressBraavos(privateKeyBraavos);
    const BraavosInitializer = calcBraavosInit(starkKeyPubBraavos);
    const BraavosProxyConstructorCallData = BraavosProxyConstructor(BraavosInitializer);

    const payload = await buildBraavosAccountDeployPayload(
        privateKeyBraavos,
        {
            classHash: BraavosProxyClassHash.toString(),
            addressSalt: starkKeyPubBraavos,
            constructorCalldata: BraavosProxyConstructorCallData,
            contractAddress: BraavosProxyAddress
        },
        {
            nonce,
            chainId,
            version,
            walletAddress: BraavosProxyAddress,
            maxFee: constants.ZERO,
            cairoVersion: cairoVersion,
        }
    );

    const response = await provider.getDeployAccountEstimateFee(
        { ...payload },
        { version, nonce },
        blockIdentifier,
        skipValidate
    );
    const suggestedMaxFee = stark.estimatedFeeToMaxFee(response.overall_fee);

    return suggestedMaxFee;

}

export async function deployBraavosAccount(
    privateKeyBraavos: num.BigNumberish,
    provider: Provider,
    max_fee?: num.BigNumberish,
): Promise<DeployContractResponse> {
    const nonce = constants.ZERO;
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    console.log("pubkey =", starkKeyPubBraavos.toString())
    const BraavosProxyAddress = calculateAddressBraavos(privateKeyBraavos);
    const BraavosInitializer = calcBraavosInit(starkKeyPubBraavos);
    const BraavosProxyConstructorCallData = BraavosProxyConstructor(BraavosInitializer);
    console.log("proxy constructor =",BraavosProxyConstructorCallData);
    max_fee ??= await estimateBraavosAccountDeployFee(privateKeyBraavos, provider);
    const version = hash.transactionVersion;
    const signatureBraavos = getBraavosSignature(
        BraavosProxyAddress,
        BraavosProxyConstructorCallData,
        starkKeyPubBraavos,
        version,
        max_fee,
        await provider.getChainId(),
        nonce,
        privateKeyBraavos,
    );

    return provider.deployAccountContract(
        {
            classHash: BraavosProxyClassHash.toString(),
            addressSalt: starkKeyPubBraavos,
            constructorCalldata: BraavosProxyConstructorCallData,
            signature: signatureBraavos
        },
        {
            nonce,
            maxFee: max_fee,
            version,
        }
    );
}
