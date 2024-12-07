import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiEAS } from './sui_eas';
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { fromB64 } from "@mysten/bcs";
import dotenv from 'dotenv';

dotenv.config();

async function getKeypair() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error('Private key not found in environment variables');

    const keypair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
    return keypair;
}

async function main() {
    const eas = new SuiEAS();

    // Example usage
    try {
        // Create a new registry
        console.log('Creating registry...');
        const registryId = "0x95f00620ea73bafdc6a237a98f1ea731c7d785ac8ca8a102266d84d444c6d385";
        console.log('Registry created with ID:', registryId);

        // Now we can use this registry ID for attestations
        const recipientAddress = '0xff65428a73d3146069525e165d545f6709c4d7b99f392a21078dc889f0b806a3'; // Replace with actual recipient address
        const schema = 'ExampleSchema1';
        const data = new TextEncoder().encode('Example attestation data 3');

        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) throw new Error('Private key not found in environment variables');

        const privateKeyBytes = fromB64(privateKey);
        const cleanedPrivateKey = privateKeyBytes.length === 33 
            ? privateKeyBytes.slice(1) 
            : privateKeyBytes;

        const keypair = Ed25519Keypair.fromSecretKey(cleanedPrivateKey);

        // Create attestation using the new registry
        console.log('Creating attestation...');
        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${process.env.PACKAGE_ID}::true_tag::create_attestation`,
            arguments: [
                tx.object(registryId),
                tx.pure(schema),
                tx.pure(recipientAddress),
                tx.pure(Array.from(data)),
            ],
        });

        const client = new SuiClient({ url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443' })
        // Execute the transaction
        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showEvents: true,
            },
        });

        console.log('True Tag attestation created:');
        console.log('Transaction digest:', result.digest);
        console.log('Transaction details:', result);
        // const attestResult = await eas.attest(
        //     registryId,
        //     recipientAddress,
        //     schema,
        //     data
        // );

        // console.log('Attestation created:', attestResult);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();