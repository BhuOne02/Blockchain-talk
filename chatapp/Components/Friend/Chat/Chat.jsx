import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import Style from './Chat.module.css';
import images from '../../../assets';
import { convertTime } from '../../../Utils/apiFeature';
import { Loader } from '../../index';

const Chat = ({
  functionName,
  readMessage,
  friendMsg,
  account,
  userName,
  loading,
  currentUserName,
  currentUserAddress,
}) => {
  const [message, setMessage] = useState('');
  const [chatData, setChatData] = useState({ name: '', address: '' });
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const { name, address } = router.query;
    if (name && address) {
      setChatData({ name, address });
      readMessage(address);
    }
  }, [router.isReady, router.query]);

  console.log("📨 friendMsg:", friendMsg);
  
  

  return (
    <div className={Style.Chat}>
      {/* Header with selected user */}
      {currentUserName && currentUserAddress && (
        <div className={Style.Chat_user_info}>
          <Image src={images.friendname} alt="avatar" width={70} height={70} />
          <div className={Style.Chat_user_info_box}>
            <h4>{currentUserName}</h4>
            <p>{currentUserAddress}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={Style.Chat_box_box}>
        <div className={Style.Chat_box}>
          <div className={Style.Chat_box_left}>
            {friendMsg.map((el, i) => (
              <div key={i} className={Style.Chat_msg_block}>
                {el.sender === chatData.address ? (
                  <div className={Style.Chat_msg_left}>
                    <Image src={images.personpic} alt="sender" width={50} height={50} />
                    <span>
                      {chatData.name} <small>{convertTime(el.timestamp)}</small>
                    </span>
                  </div>
                ) : (
                  <div className={Style.Chat_msg_right}>
                    <Image src={images.personpic} alt="you" width={50} height={50} />
                    <span>
                      {userName} <small>{convertTime(el.timestamp)}</small>
                    </span>
                  </div>
                )}
                <p>{el.msg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Send Message Box */}
        {currentUserName && currentUserAddress && (
          <div className={Style.Chat_box_send}>
            <Image src={images.message} alt="input" width={40} height={40} />
            <input
              type="text"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={Style.Chat_input}
            />
            <Image src={images.file} alt="file" width={40} height={40} />
            {loading ? (
              <Loader />
            ) : (
              <Image
                src={images.send}
                alt="send"
                width={40}
                height={40}
                onClick={() => {
                  if (!chatData.address) {
                    alert("No recipient selected. Please select a friend to chat with.");
                    return;
                  }
                  functionName({ msg: message, address: chatData.address });
                }}
                className={Style.Chat_send_btn}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
