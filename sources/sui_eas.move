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
        attestations: Table<u64, Attestation>, 
        counter: u64
    }

    public struct Attestation has store {
        attester: address,
        recipient: address,
        data: String,
        revoked: bool,
        timestamp: u64
    }

    public struct AttestationEvent has copy, drop {
        uid: vector<u8>,
        attester: address,
        recipient: address
    }

    public struct RevocationEvent has copy, drop {
        uid: u64
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(AttestationRegistry {
            id: object::new(ctx),
            attestations: table::new(ctx), 
            counter: 0
        });
    }

    public entry fun attest(
        registry: &mut AttestationRegistry,
        recipient: address,
        data: String,
        ctx: &mut TxContext
    ) {
        let attester = tx_context::sender(ctx);
        let timestamp = tx_context::epoch(ctx);
        
        let uid = generate_uid(ctx,attester, recipient, timestamp);
        
        table::add(&mut registry.attestations, registry.counter, Attestation {
            attester,
            recipient,
            data,
            revoked: false,
            timestamp
        });

        registry.counter = registry.counter + 1;
        
        event::emit(AttestationEvent { uid, attester, recipient });
    }

    fun generate_uid(ctx: &TxContext, attester: address, recipient: address, timestamp: u64): vector<u8> {
        let tx_time = tx_context::epoch_timestamp_ms(ctx);  // Get ms timestamp
        
        let mut uid = vector::empty();  // Add 'mut' here
        vector::append(&mut uid, bcs::to_bytes(&attester));
        vector::append(&mut uid, bcs::to_bytes(&recipient));
        vector::append(&mut uid, bcs::to_bytes(&timestamp));
        vector::append(&mut uid, bcs::to_bytes(&tx_time));  // Add ms timestamp
        uid
    }

    public fun is_valid(registry: &AttestationRegistry, uid: u64): bool {
        table::contains(&registry.attestations, uid) 
            && !table::borrow(&registry.attestations, uid).revoked
    }

    public entry fun revoke(
        registry: &mut AttestationRegistry,
        uid: u64,
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
        uid: u64
    ): &Attestation {
        assert!(table::contains(&registry.attestations, uid), ERROR_ATTESTATION_NOT_FOUND);
        table::borrow(&registry.attestations, uid)
    }
}