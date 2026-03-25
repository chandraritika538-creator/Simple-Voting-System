# 🗳️ Simple Voting System 

## 📌 Project Description
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/19e57e0a-2b41-476d-b166-e631ef79ae85" />

This project is a basic decentralized voting system built using Soroban smart contracts on the Stellar blockchain. It allows users to vote for predefined candidates in a transparent and tamper-proof way.

## ⚙️ What it does
- Initializes a list of candidates
- Allows users to cast votes for a candidate
- Stores votes securely on-chain
- Retrieves vote counts for individual candidates
- Displays all voting results

## ✨ Features
- Decentralized voting mechanism
- Transparent and immutable vote storage
- Simple and efficient contract design
- On-chain vote counting
- Easy integration with frontend apps

## 🔗 Deployed Smart Contract Link
https://stellar.expert/explorer/testnet/contract/CBTZVGCHZQXSHDKMJ27C57J67YX4IY74X7ZWHVUNR6BW7GALQCDAVZHS

## 🛠️ How to Use
1. **Clone the repo**: `git clone <your-repo-link>`
2. **Build**: `stellar contract build`
3. **Deploy**: `stellar contract deploy --network testnet --source-account <your-account> --wasm target/wasm32-unknown-unknown/release/voting_system.wasm`
4. **Interact**: Use the CLI to call `vote` or `get_results`.
