import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { fromB64 } from "@mysten/bcs";
import dotenv from 'dotenv';

dotenv.config();

export class SuiEAS {
    private client: SuiClient;
    private keypair: Ed25519Keypair;
    private packageId: string;

    constructor() {
        this.client = new SuiClient({ url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443' });
        
        // Initialize keypair with private key from env
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) throw new Error('Private key not found in environment variables');

        const privateKeyBytes = fromB64(privateKey);
        const cleanedPrivateKey = privateKeyBytes.length === 33 
            ? privateKeyBytes.slice(1) 
            : privateKeyBytes;

        this.keypair = Ed25519Keypair.fromSecretKey(cleanedPrivateKey);
        
        // Get package ID from env
        this.packageId = process.env.PACKAGE_ID || '';
        if (!this.packageId) throw new Error('Package ID not found in environment variables');
    }

    async attest(
        registryId: string,
        recipient: string,
        schema: string,
        data: Uint8Array
    ) {
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${this.packageId}::attestation::attest`,
            arguments: [
                tx.object(registryId),
                tx.pure(recipient),
                tx.pure(schema),
                tx.pure(Array.from(data)),
            ],
        });

        return await this.client.signAndExecuteTransactionBlock({
            signer: this.keypair,
            transactionBlock: tx,
        });
    }

    async revoke(registryId: string, uid: Uint8Array) {
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${this.packageId}::attestation::revoke`,
            arguments: [
                tx.object(registryId),
                tx.pure(Array.from(uid)),
            ],
        });

        return await this.client.signAndExecuteTransactionBlock({
            signer: this.keypair,
            transactionBlock: tx,
        });
    }

    async isValid(registryId: string, uid: Uint8Array) {
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${this.packageId}::attestation::is_valid`,
            arguments: [
                tx.object(registryId),
                tx.pure(Array.from(uid)),
            ],
        });

        const result = await this.client.devInspectTransactionBlock({
            sender: this.keypair.getPublicKey().toSuiAddress(),
            transactionBlock: tx,
        });

        if (!result.results?.[0]?.returnValues?.[0]) {
            throw new Error('Failed to check attestation validity');
        }

        // The return value from Move is a boolean, which comes as [0] or [1]
        const returnValue = result.results[0].returnValues[0] as unknown[];
        if (!Array.isArray(returnValue)) {
            throw new Error('Unexpected return value type');
        }
        
        // Convert the array value to boolean
        return Boolean(returnValue[0]);
    }
}