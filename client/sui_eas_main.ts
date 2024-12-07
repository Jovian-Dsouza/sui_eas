import { SuiEAS } from './sui_eas';

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

        // Create attestation using the new registry
        console.log('Creating attestation...');
        const attestResult = await eas.attest(
            registryId,
            recipientAddress,
            schema,
            data
        );
        console.log('Attestation created:', attestResult);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();