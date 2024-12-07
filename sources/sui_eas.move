module sui_eas::attestation {
    use sui::table::{Self, Table};
    use std::string::String;
    use sui::bcs;
    use sui::event;
    
    #[error]
    const ERROR_NOT_AUTHORIZED: u64 = 1;
    #[error]
    const ERROR_ALREADY_REVOKED: u64 = 2;
    #[error]
    const ERROR_ATTESTATION_NOT_FOUND: u64 = 3;

    public struct AttestationRegistry has key {
        id: UID,
        attestations: Table<vector<u8>, Attestation>
    }

    public struct Attestation has store {
        attester: address,
        recipient: address,
        schema: String,
        data: vector<u8>,
        revoked: bool,
        timestamp: u64
    }

    // Event structs must be public
    public struct AttestationEvent has copy, drop {
        uid: vector<u8>,
        attester: address,
        recipient: address
    }

    public struct RevocationEvent has copy, drop {
        uid: vector<u8>
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(AttestationRegistry {
            id: object::new(ctx),
            attestations: table::new(ctx)
        });
    }

    public entry fun attest(
        registry: &mut AttestationRegistry,
        recipient: address,
        schema: String,
        data: vector<u8>,
        ctx: &mut TxContext
    ) {
        let attester = tx_context::sender(ctx);
        let timestamp = tx_context::epoch(ctx);
        
        // Simplified UID generation
        let uid = generate_uid(attester, recipient, timestamp);
        
        table::add(&mut registry.attestations, uid, Attestation {
            attester,
            recipient,
            schema,
            data,
            revoked: false,
            timestamp
        });
        
        // Simplified event
        event::emit(AttestationEvent { uid, attester, recipient });
    }

    fun generate_uid(attester: address, recipient: address, timestamp: u64): vector<u8> {
        let mut uid = vector::empty();
        vector::append(&mut uid, bcs::to_bytes(&attester));
        vector::append(&mut uid, bcs::to_bytes(&recipient));
        vector::append(&mut uid, bcs::to_bytes(&timestamp));
        uid
    }

    public fun is_valid(registry: &AttestationRegistry, uid: vector<u8>): bool {
        table::contains(&registry.attestations, uid) 
            && !table::borrow(&registry.attestations, uid).revoked
    }

    public entry fun revoke(
        registry: &mut AttestationRegistry,
        uid: vector<u8>,
        ctx: &mut TxContext
    ) {
        let attestation = table::borrow_mut(&mut registry.attestations, uid);
        assert!(attestation.attester == tx_context::sender(ctx), ERROR_NOT_AUTHORIZED);
        assert!(!attestation.revoked, ERROR_ALREADY_REVOKED);
        
        attestation.revoked = true;
        event::emit(RevocationEvent { uid });
    }

    public fun get_attestation(
        registry: &AttestationRegistry,
        uid: vector<u8>
    ): &Attestation {
        assert!(table::contains(&registry.attestations, uid), ERROR_ATTESTATION_NOT_FOUND);
        table::borrow(&registry.attestations, uid)
    }
}