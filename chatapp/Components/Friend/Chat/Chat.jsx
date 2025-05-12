
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import Style from './Chat.module.css';
import images from '../../../assets';
import { convertTime } from '../../../Utils/apiFeature';
import { Loader } from '../../index';

// --- Pinata upload ---
const uploadToPinata = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: "",
        pinata_secret_api_key: ""
      },
      body: formData
    });

    const data = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
  } catch (err) {
    console.error("Pinata upload error:", err);
    return null;
  }
};

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ipfsUrl = await uploadToPinata(file);
    if (!ipfsUrl) return alert("Failed to upload file.");

    if (!chatData.address) return alert("Select a recipient first.");
    await functionName({ msg: ipfsUrl, address: chatData.address });
  };

  return (
    <div className={Style.Chat}>
      {/* Header */}
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
          {friendMsg.map((el, i) => {
              const isMe = el.sender.toLowerCase() === account.toLowerCase();
              const dName = isMe ? userName : chatData.name;

              return (
                <div key={i} className={isMe ? Style.right : Style.left}>
                  <Image src={images.personpic} alt="avatar" width={50} height={50} />
                  <div>
                    <span className={Style.name}>
                      {dName} <small>{convertTime(el.timestamp)}</small>
                    </span>
                    {el.msg.startsWith("http") && el.msg.includes("ipfs") ? (
                      <img src={el.msg} alt="media" style={{ maxWidth: "300px", borderRadius: "8px", marginTop: "6px" }} />
                    ) : (
                      <p>{el.msg}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input */}
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
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              id="media-upload"
            />
            <label htmlFor="media-upload">
              <Image src={images.file} alt="upload" width={40} height={40} style={{ cursor: "pointer" }} />
            </label>
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
                  setMessage('');
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
