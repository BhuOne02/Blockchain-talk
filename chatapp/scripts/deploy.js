// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const ChatApp = await ethers.getContractFactory("ChatApp");
  const chatApp = await ChatApp.deploy();
  await chatApp.waitForDeployment();

  console.log(`✅ Contract deployed to: ${chatApp.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
