module sui_eas::true_tag {
    use sui_eas::attestation::{Self, AttestationRegistry};
    use std::string::String;


    // Create a new True Tag attestation
    public entry fun create_attestation(
        registry: &mut AttestationRegistry,
        schema: String,
        recipient: address,
        data: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Create attestation through SUI EAS with simplified parameters
        attestation::attest(
            registry,
            recipient,
            schema,
            data,
            ctx
        );
    }
}