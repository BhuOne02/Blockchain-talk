import React, { useContext } from 'react';
import Styles from "./Friend.module.css";
import Card from "./Card/Card";
import Chat from "./Chat/Chat";
import { ChatAppContext } from '@/Context/ChatAppContext';

const Friend = () => {
  const {
    readMessage,
    sendMessage,
    readUser,
    account,
    userName,
    friendLists,
    friendMsg,
    loading,
    currentUserName,
    currentUserAddress,
  } = useContext(ChatAppContext);

  return (
    <div className={Styles.Friend}>
      <div className={Styles.Friend_box}>
        {/* LEFT PANEL: FRIEND LIST */}
        <div className={Styles.Friend_box_left}>
          {friendLists.map((el, i) => (
            <Card
              key={i}
              el={el}
              i={i}
              readMessage={readMessage}
              readUser={readUser}
            />
          ))}
        </div>

        {/* RIGHT PANEL: CHAT WINDOW */}
        <div className={Styles.Friend_box_right}>
          <Chat
            functionName={sendMessage}
            readMessage={readMessage}
            friendMsg={friendMsg}
            account={account}
            userName={userName}
            loading={loading}
            currentUserName={currentUserName}
            currentUserAddress={currentUserAddress}
          />
        </div>
      </div>
    </div>
  );
};

export default Friend;
