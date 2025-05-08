import {ethers} from "ethers";
import Web3Modal from "web3modal";

import { ChatAppAddress,ChatAppABI } from "@/Context/constants"

export const CheckIfWalletConnected = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }
  
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
  
    return accounts[0];
  };
  

export const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }
  
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
  
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }
  
    return accounts[0];
  };
  

export const fetchContract=(signerOrProvider)=> 
    new ethers.Contract(ChatAppAddress,ChatAppABI,signerOrProvider);

export const connectingWithContract = async () => {
    try {
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
  
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
  
      return fetchContract(signer);
    } catch (error) {
      throw new Error("Could not connect to Web3Modal or Ethereum provider");
    }
  };
  

  export const convertTime = (time) => {
    const date = new Date(time.toNumber() * 1000); // Convert from seconds
    return date.toLocaleString(); // Better human-readable format
};
