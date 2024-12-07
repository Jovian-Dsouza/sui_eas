import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { fromB64, MIST_PER_SUI } from '@mysten/sui.js/utils';
import dotenv from 'dotenv';
dotenv.config();

export class TrueTagClient {
    private client: SuiClient;
    private packageId: string;
    private vaultId: string;
    private registryId: string;

    constructor(
        client: SuiClient,
        packageId: string,
        vaultId: string,
        registryId: string,
    ) {
        this.client = client;
        this.packageId = packageId;
        this.vaultId = vaultId;
        this.registryId = registryId;
    }

    async createTask(
        signer: Ed25519Keypair,
        taskTypeId: number,
        taskName: string,
        rewardPerAnnotation: number,
        requiredAnnotations: number,
        paymentAmount: number // in SUI
    ) {
        const tx = new TransactionBlock();
        
        // Convert SUI to MIST
        const paymentInMist = BigInt(Math.floor(paymentAmount * Number(MIST_PER_SUI)));
        
        // Create coin for payment
        const [coin] = tx.splitCoins(tx.gas, [tx.pure(paymentInMist)]);

        tx.moveCall({
            target: `${this.packageId}::true_tag::create_task`,
            arguments: [
                tx.object(this.vaultId),
                tx.pure(taskTypeId),
                tx.pure(taskName),
                tx.pure(rewardPerAnnotation),
                tx.pure(requiredAnnotations),
                coin
            ],
        });

        const result = await this.client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showEvents: true,
            },
        });

        return result;
    }

    async submitAnnotation(
        signer: Ed25519Keypair,
        taskId: number,
        data: Uint8Array
    ) {
        const tx = new TransactionBlock();

        tx.moveCall({
            target: `${this.packageId}::true_tag::submit_annotation`,
            arguments: [
                tx.object(this.vaultId),
                tx.object(this.registryId),
                tx.pure(taskId),
                tx.pure(Array.from(data)),
            ],
        });

        const result = await this.client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showEvents: true,
            },
        });

        return result;
    }
}

async function getKeypair() {
    const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) throw new Error('Private key not found in environment variables');

        const privateKeyBytes = fromB64(privateKey);
        const cleanedPrivateKey = privateKeyBytes.length === 33 
            ? privateKeyBytes.slice(1) 
            : privateKeyBytes;

    const keypair = Ed25519Keypair.fromSecretKey(cleanedPrivateKey);
    return keypair;
}

// Example usage:
async function main() {
    try {
        const client = new SuiClient({ 
            url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443' 
        });

        const trueTag = new TrueTagClient(
            client,
            process.env.PACKAGE_ID!,
            process.env.VAULT_ID!,
            process.env.REGISTRY_ID!
        );
        console.log("TrueTagClient initialized", trueTag);

        // Example: Create a task
        const keypair = await getKeypair();

        // Create a new task
        const createTaskResult = await trueTag.createTask(
            keypair,
            1, // taskTypeId
            "Image Classification", // taskName
            100000, // rewardPerAnnotation (in MIST)
            10, // requiredAnnotations
            0.001 // paymentAmount (in SUI)
        );
        console.log('Task created:', createTaskResult);

        // Submit an annotation
        const annotationData = new TextEncoder().encode('Sample annotation data');
        const submitResult = await trueTag.submitAnnotation(
            keypair,
            1,
            annotationData
        );
        console.log('Annotation submitted:', submitResult);

    } catch (error) {
        console.error('Error:', error);
    }
}

// Uncomment to run the example
main();