# 🗨️ Decentralized ChatApp

A fully decentralized, end-to-end encrypted messaging platform built using **React.js**, **Solidity**, **Hardhat**, and **IPFS via Pinata**. Users can chat privately, create groups, and share media without relying on any centralized backend.

---

## 🔧 Tech Stack

- **Frontend**: React.js, CSS Modules
- **Smart Contracts**: Solidity
- **Blockchain Simulation**: Hardhat (Local Ethereum Network)
- **Wallet Integration**: MetaMask
- **File Storage**: IPFS via Pinata

---

## 🚀 Features

- MetaMask-based authentication
- Send and accept friend requests
- One-to-one chat with your contacts
- Create and chat in group conversations
- Upload and share media (images) using IPFS
- All messages and interactions are decentralized

---

## ⚙️ Getting Started

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/Decentralized-ChatApp.git
cd Decentralized-ChatApp
npm install


 Run Local Blockchain with Hardhat
npx hardhat node

npx hardhat run scripts/deploy.js --network localhost
Copy the deployed contract address and update it in constants.js

npm run dev

Visit: http://localhost:3000

Connect MetaMask to localhost:8545 network and import a test account (from Hardhat accounts).

Project Structure
.
├── contracts/               # Solidity smart contract
├── scripts/                 # Deployment script
├── pages/                  # Next.js app entry points
├── Components/             # Reusable components (Chat, Friend, Group)
├── Context/ChatAppContext  # Global state and blockchain logic
├── styles/                 # CSS Modules
├── assets/                 # Static images/icons


📦 Media Handling via IPFS
When users upload an image, it’s sent to Pinata, which stores it on IPFS.

Only the IPFS hash (not the file itself) is stored or transmitted.

Messages with media show the image using the IPFS public gateway.

Why Pinata?
We evaluated Infura, NFT.Storage, and Web3.Storage, but chose Pinata for its:

Simplicity

Consistent performance

Browser-friendly API


🛠️ How Hardhat Is Used
npx hardhat node: Spins up a local Ethereum blockchain with test accounts.

npx hardhat run scripts/deploy.js --network localhost: Deploys the ChatApp contract locally.

Smart contract stores all message metadata and relationships (friends, groups).

Frontend connects to the contract via Ethers.js and interacts in real-time.

📸 Demo Flow
Create Account with MetaMask

Add Friends using address and name

Start Chatting – 1-to-1 or in groups

Upload Media – Image is uploaded to IPFS via Pinata

View Message History stored on-chain (locally)






