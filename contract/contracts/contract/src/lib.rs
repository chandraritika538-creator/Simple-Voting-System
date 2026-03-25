#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, Env, Map, String, Vec
};

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    // Initialize candidates
    pub fn init(env: Env, candidates: Vec<String>) {
        let mut votes: Map<String, u32> = Map::new(&env);

        for candidate in candidates.iter() {
            let name: String = candidate.clone(); // explicit type
            votes.set(name, 0u32); // explicit u32
        }

        env.storage().instance().set(&symbol_short!("VOTES"), &votes);
    }

    // Vote for a candidate
    pub fn vote(env: Env, candidate: String) {
        let key = symbol_short!("VOTES");

        let mut votes: Map<String, u32> =
            env.storage().instance().get(&key).unwrap();

        let count: u32 = votes.get(candidate.clone()).unwrap_or(0u32);
        votes.set(candidate, count + 1);

        env.storage().instance().set(&key, &votes);
    }

    // Get votes
    pub fn get_votes(env: Env, candidate: String) -> u32 {
        let votes: Map<String, u32> =
            env.storage().instance().get(&symbol_short!("VOTES")).unwrap();

        votes.get(candidate).unwrap_or(0u32)
    }

    // Get all results
    pub fn get_all(env: Env) -> Map<String, u32> {
        env.storage()
            .instance()
            .get(&symbol_short!("VOTES"))
            .unwrap()
    }
}