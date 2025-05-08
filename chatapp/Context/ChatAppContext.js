//ChatAppContext.js
import React,{useState,useEffect} from 'react';
import { useRouter } from 'next/router';


import { CheckIfWalletConnected,connectWallet,connectingWithContract } from '@/Utils/apiFeature';

export const ChatAppContext=React.createContext();


export const ChatAppProvider=({children})=>{
    const [account,setAccount]=useState("");
    const [userName,setUserName]=useState("");
    const [friendLists,setFriendLists]=useState([]);
    const [friendMsg,setFriendmsg]=useState([]);
    const [loading,setLoading]=useState(false);
    const [userLists,setUserLists]=useState([]);
    const [error,setError]=useState("");

    //User Data
    const [currentUserName, setCurrentUserName]=useState("")
    const [currentUserAddress, setCurrentUserAddress]=useState("")

    const router = useRouter();

    const fetchData = async () => {
        try {
          const contract = await connectingWithContract();
          const connectAccount = await connectWallet();
          setAccount(connectAccount);
          console.log("Calling checkUserExists on:", connectAccount);
          
      
          // Check if user is registered
          const isUser = await contract.checkUserExists(connectAccount);
          if (isUser) {
            const userName = await contract.getUsername(connectAccount);
            setUserName(userName);
          } else {
            setUserName(""); // Show "Create Account" in UI
          }
      
          const friendLists = await contract.getMyFriendList();
          setFriendLists(friendLists);
      
          const userList = await contract.getAllUsers();
          setUserLists(userList);
        } catch (err) {
          console.error("fetchData error:", err.message);
          setError(err.message || "Please install and connect your wallet");
        }
      };
      
      
    useEffect(()=>{
        fetchData();
    },[]);

    const readMessage = async (friendAddress) => {
      console.log("🔍 Reading messages for:", friendAddress); // ✅ Add this
      try {
        const contract = await connectingWithContract();
        const read = await contract.readMessage(friendAddress);
        console.log("✅ Messages:", read); // ✅ Add this
        setFriendmsg(read);
      } catch (error) {
        setError("Currently No messages");
      }
    };

    const createAccount = async (name) => {
        try {
          console.log("🔁 createAccount() called with:", name);
      
          const contract = await connectingWithContract();
          console.log("✅ Connected to contract:", contract.address);
        
          const getCreatedUser = await contract.createAccount(name);
          
          console.log("⏳ Transaction sent, now waiting...");

      
          setLoading(true);
          await getCreatedUser.wait();
          setLoading(false);
          window.location.reload();
        } catch (error) {
          console.error("❌ Create account error:", error);
          setError("Error while creating the account. Please reload the browser.");
        }
      };
      

      const addFriend = async ({ accountAddress, name }) => {
        try {
          if (!name || !accountAddress) {
            setError("Please provide the name and address");
            return false;
          }
      
          const contract = await connectingWithContract();
          const tx = await contract.addFriend(accountAddress, name);
          setLoading(true);
          await tx.wait();
          setLoading(false);
      
          // ✅ Re-fetch friend list
          const updatedFriends = await contract.getMyFriendList();
          setFriendLists(updatedFriends);
      
          return true;
        } catch (error) {
          setError("Failed to add friend. Try again.");
          return false;
        }
      };
      

    const sendMessage = async ({ msg, address }) => {
      try {
        if (!msg || !address) {
          return setError("Please type your message and select a friend.");
        }
    
        const contract = await connectingWithContract();
        console.log("✅ Sending message to:", address);
    
        const tx = await contract.sendMessage(address, msg);
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.location.reload();
      } catch (error) {
        console.error("SendMessage Error:", error);
        setError("Please reload and try again.");
      }
    };
    

    const readUser=async(userAddress)=>{
        const contract= await  connectingWithContract();
        const userName=contract.getUsername(userAddress);
        setCurrentUserName(userName);
        setCurrentUserAddress(userAddress);

    }

    const sendFriendRequest = async ({ to, name }) => {
      console.log(to,"+",name)

      try {
        if (!to || !name) {
          setError("Name or address missing");
          return;
        }
        const contract = await connectingWithContract();
        const tx = await contract.sendFriendRequest(to, name);
        setLoading(true);
        await tx.wait();
        setLoading(false);
      } catch (error) {
        console.error("Friend request failed:", error);
        setError("Failed to send friend request");
      }
    };
    
    const acceptFriendRequest = async (fromAddress) => {
      try {
        const contract = await connectingWithContract();
        const tx = await contract.acceptFriendRequest(fromAddress);
        setLoading(true);
        await tx.wait();
        setLoading(false);
      } catch (error) {
        console.error("Accept Friend Request Error:", error);
        setError(extractRevertReason(error));
      }
    };
    
    const getPendingRequests = async () => {
      try {
        const contract = await connectingWithContract();
        const requests = await contract.getPendingRequests(); // returns array of structs: { name, accountAddress }
        return requests.map(req => ({
          name: req.name,
          accountAddress: req.accountAddress
        }));
      } catch (error) {
        console.error("Error fetching pending requests", error);
        return [];
      }
    };
    

    return(
        <ChatAppContext.Provider value={{
            readMessage,
            createAccount,
            addFriend,
            sendMessage,
            readUser,
            account,
            userName,
            friendLists,
            friendMsg,
            loading,
            userLists,
            error,
            currentUserName,
            currentUserAddress,
            setFriendmsg,
            CheckIfWalletConnected,
            connectWallet,
            sendFriendRequest,
            acceptFriendRequest,
            getPendingRequests,
        }}>
            {children}
        </ChatAppContext.Provider>
    );
};