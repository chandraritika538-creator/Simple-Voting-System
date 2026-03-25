#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, String, Vec};

#[test]
fn test_create_poll() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let poll_id = String::from_str(&env, "poll1");
    let candidates = {
        let mut v = Vec::new(&env);
        v.push_back(String::from_str(&env, "Alice"));
        v.push_back(String::from_str(&env, "Bob"));
        v
    };

    client.create_poll(&poll_id, &candidates, &user);

    let result = client.get_poll(&poll_id);
    assert!(result.is_some());
    assert_eq!(result.unwrap().len(), 2);
}

#[test]
fn test_vote() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let poll_id = String::from_str(&env, "poll1");
    let candidates = {
        let mut v = Vec::new(&env);
        v.push_back(String::from_str(&env, "Alice"));
        v.push_back(String::from_str(&env, "Bob"));
        v
    };

    client.create_poll(&poll_id, &candidates, &user);
    client.vote(&poll_id, &String::from_str(&env, "Alice"), &user);

    let votes = client.get_poll_votes(&poll_id);
    assert_eq!(votes.get(String::from_str(&env, "Alice")).unwrap(), 1);
}

#[test]
#[should_panic(expected = "already voted")]
fn test_cannot_vote_twice() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let poll_id = String::from_str(&env, "poll1");
    let candidates = {
        let mut v = Vec::new(&env);
        v.push_back(String::from_str(&env, "Alice"));
        v
    };

    client.create_poll(&poll_id, &candidates, &user);
    client.vote(&poll_id, &String::from_str(&env, "Alice"), &user);
    client.vote(&poll_id, &String::from_str(&env, "Alice"), &user);
}

#[test]
#[should_panic(expected = "poll not found")]
fn test_vote_nonexistent_poll() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let poll_id = String::from_str(&env, "nonexistent");
    let candidate = String::from_str(&env, "Alice");

    client.vote(&poll_id, &candidate, &user);
}

#[test]
#[should_panic(expected = "invalid candidate")]
fn test_vote_invalid_candidate() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let poll_id = String::from_str(&env, "poll1");
    let candidates = {
        let mut v = Vec::new(&env);
        v.push_back(String::from_str(&env, "Alice"));
        v
    };

    client.create_poll(&poll_id, &candidates, &user);
    client.vote(&poll_id, &String::from_str(&env, "Bob"), &user);
}

#[test]
fn test_multiple_voters() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let poll_id = String::from_str(&env, "poll1");
    let candidates = {
        let mut v = Vec::new(&env);
        v.push_back(String::from_str(&env, "Alice"));
        v.push_back(String::from_str(&env, "Bob"));
        v
    };

    client.create_poll(&poll_id, &candidates, &user1);
    client.vote(&poll_id, &String::from_str(&env, "Alice"), &user1);
    client.vote(&poll_id, &String::from_str(&env, "Alice"), &user2);

    let votes = client.get_poll_votes(&poll_id);
    assert_eq!(votes.get(String::from_str(&env, "Alice")).unwrap(), 2);
}

#[test]
fn test_has_voted() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let poll_id = String::from_str(&env, "poll1");
    let candidates = {
        let mut v = Vec::new(&env);
        v.push_back(String::from_str(&env, "Alice"));
        v
    };

    client.create_poll(&poll_id, &candidates, &user);

    assert!(!client.has_voted(&poll_id, &user));

    client.vote(&poll_id, &String::from_str(&env, "Alice"), &user);

    assert!(client.has_voted(&poll_id, &user));
}

#[test]
fn test_get_all_polls() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let poll1 = String::from_str(&env, "poll1");
    let poll2 = String::from_str(&env, "poll2");

    let candidates1 = {
        let mut v = Vec::new(&env);
        v.push_back(String::from_str(&env, "A"));
        v
    };
    let candidates2 = {
        let mut v = Vec::new(&env);
        v.push_back(String::from_str(&env, "B"));
        v
    };

    client.create_poll(&poll1, &candidates1, &user);
    client.create_poll(&poll2, &candidates2, &user);

    let all_polls = client.get_all_polls();
    assert_eq!(all_polls.len(), 2);
}
