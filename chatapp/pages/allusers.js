import React, { useState, useEffect, useContext } from 'react';

import { UserCard } from '@/Components/index';
import Style from "../styles/allusers.module.css";
import { ChatAppContext } from '@/Context/ChatAppContext';

const AllUsers = () => {
  const {
    userLists,
    friendLists,
    sendFriendRequest,
    addFriend,
    account,
    getPendingRequests,
  } = useContext(ChatAppContext);

  const [activeTab, setActiveTab] = useState("find");
  const [pending, setPending] = useState([]);

  const filteredUsers = userLists.filter(user => {
    const currentAccount = account?.toLowerCase();
    const userAddress = user.accountAddress?.toLowerCase();

    const isNotCurrentUser = userAddress !== currentAccount;
    const isNotFriend = !friendLists.some(friend => friend.pubkey.toLowerCase() === userAddress);

    return isNotCurrentUser && isNotFriend;
  });

  useEffect(() => {
    if (activeTab === "pending") {
      (async () => {
        const data = await getPendingRequests();
        console.log("pending", data);
        setPending(data);
      })();
    }
  }, [activeTab]);

  useEffect(() => {
    console.log("Updated friends list:", friendLists);
  }, [friendLists]);

  return (
    <div className={Style.wrapper}>
      <div className={Style.tab_buttons}>
        <button name="find" onClick={() => setActiveTab("find")}>Find People</button>
        <button name="pending" onClick={() => setActiveTab("pending")}>Pending Requests</button>
        <button name="friends" onClick={() => setActiveTab("friends")}>Friend List</button>
      </div>


      {activeTab === "find" && (
        <div className={Style.alluser}>
          {filteredUsers.map((el, i) => (
            <UserCard key={i} el={el} sendFriendRequest={sendFriendRequest} type="find" />
          ))}
        </div>
      )}


      {activeTab === "pending" && (
        <div className={Style.alluser}>
          {
          pending.map((user, i) => (
           <UserCard
           key={i}
           el={user}
           addFriend={addFriend}
           setPending={setPending}
           pending={pending}
           getPendingRequests={getPendingRequests}
           type="pending"
         />
          ))}
        </div>
      )}


      {activeTab === "friends" && (
        <div className={Style.alluser}>
          {friendLists.map((el, i) => (
            <UserCard key={i} el={{ name: el.name, accountAddress: el.pubkey }} type="friend" />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllUsers;
