module sui_eas::true_tag {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use std::string::String;
    use sui_eas::attestation::{Self, AttestationRegistry};

    /// Error codes
    const EInsufficientBalance: u64 = 0;
    const ETaskCompleted: u64 = 2;

    /// Represents different types of annotation tasks
    public struct TaskType has store, copy, drop {
        task_type_id: u64,
        name: String,
    }

    /// Main vault that holds SUI tokens for rewards
    public struct AnnotationVault has key {
        id: UID,
        tasks: Table<u64, AnnotationTask>,
        task_counter: u64,
    }

    /// Represents a single annotation task
    public struct AnnotationTask has store {
        task_type: TaskType,
        reward_per_annotation: u64,
        remaining_budget: Balance<SUI>,
        company: address,
        completed_annotations: u64,
        required_annotations: u64,
    }

    // === Initialize functions ===

    fun init(ctx: &mut TxContext) {
        let vault = AnnotationVault {
            id: object::new(ctx),
            tasks: table::new(ctx),
            task_counter: 0,
        };
        transfer::share_object(vault);
    }

    // === Public functions ===

    public entry fun create_task(
        vault: &mut AnnotationVault,
        task_type_id: u64,
        task_name: String,
        reward_per_annotation: u64,
        required_annotations: u64,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let payment_amount = coin::value(&payment);
        let total_reward = reward_per_annotation * required_annotations;
        assert!(payment_amount >= total_reward, EInsufficientBalance);

        let task_type = TaskType {
            task_type_id,
            name: task_name,
        };

        let task = AnnotationTask {
            task_type,
            reward_per_annotation,
            remaining_budget: coin::into_balance(payment),
            company: tx_context::sender(ctx),
            completed_annotations: 0,
            required_annotations,
        };

        let task_id = vault.task_counter;
        vault.task_counter = task_id + 1;
        table::add(&mut vault.tasks, task_id, task);
    }

    public entry fun submit_annotation(
        vault: &mut AnnotationVault,
        registry: &mut AttestationRegistry,
        task_id: u64,
        data: String,
        ctx: &mut TxContext
    ) {
        let task = table::borrow_mut(&mut vault.tasks, task_id);
        
        assert!(task.completed_annotations < task.required_annotations, ETaskCompleted);

        attestation::attest(
            registry,
            tx_context::sender(ctx),
            data,
            ctx
        );

        let reward_coins = coin::from_balance(
            balance::split(&mut task.remaining_budget, task.reward_per_annotation),
            ctx
        );
        transfer::public_transfer(reward_coins, tx_context::sender(ctx));

        task.completed_annotations = task.completed_annotations + 1;
    }
}