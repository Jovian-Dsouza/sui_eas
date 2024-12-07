import { SuiEAS } from './sui_eas';

async function main() {
    const eas = new SuiEAS();

    // Example usage
    try {
        // Replace these with actual values
        // const registryId = 'your_registry_object_id';
        // const recipientAddress = 'recipient_address';
        // const schema = 'ExampleSchema';
        // const data = new TextEncoder().encode('Example attestation data');

        // // Create attestation
        // console.log('Creating attestation...');
        // const attestResult = await eas.attest(
        //     registryId,
        //     recipientAddress,
        //     schema,
        //     data
        // );
        // console.log('Attestation created:', attestResult);

        // // Check validity
        // const uid = new TextEncoder().encode('example_uid'); // Replace with actual UID
        // const isValid = await eas.isValid(registryId, uid);
        // console.log('Attestation is valid:', isValid);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();