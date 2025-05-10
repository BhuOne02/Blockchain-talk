import React, { useState, useContext } from 'react';
import Image from "next/image";
import Link from "next/link";
import Style from "./UserCard.module.css";
import images from "../../assets";
import { ChatAppContext } from "@/Context/ChatAppContext";

const UserCard = ({ el, type, addFriend, sendFriendRequest, setPending, pending, getPendingRequests }) => {
  const { acceptFriendRequest } = useContext(ChatAppContext);

 


  const handleAddFriend = async () => {

    await acceptFriendRequest(el.accountAddress);
  
    if (getPendingRequests && setPending) {
      const updatedPending = await getPendingRequests();
      console.log(updatedPending)
      setPending(updatedPending);
    }
  };
  
  

  const handleSendRequest = async () => {
    await sendFriendRequest({ to: el.accountAddress, name: el.name });
  };

  return (
    <div className={Style.UserCard}>
      <div className={Style.UserCard_box}>
        <Image src={images.logo} alt="user" width={100} height={100} />
      </div>

      <div className={Style.UserCard_box_info}>
        <h3>{el.name}</h3>
        <p>{el.accountAddress}</p>

        {type === "pending" && (
          <button onClick={handleAddFriend} className={Style.UserCard_button}>
            Accept Request
          </button>
        )}

        {type === "find" && (
          <button onClick={handleSendRequest} className={Style.UserCard_button}>
            Send Friend Request
          </button>
        )}

        {type === "friend" && (
          <Link
            href={{
              pathname: "/",
              query: { name: el.name, address: el.accountAddress },
            }}
          >
            <button className={Style.UserCard_button}>Chat</button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default UserCard;
