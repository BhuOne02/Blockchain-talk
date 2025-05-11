// Components/Group/GroupChat.jsx
import React, { useState, useContext } from "react";
import Image  from "next/image";
import Style  from "./GroupChat.module.css";
import images from "../../../assets";          // adjust if your assets path differs
import { convertTime } from "@/Utils/apiFeature";
import { ChatAppContext } from "@/Context/ChatAppContext";


const uploadToPinata = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: "d2f4cc378c9a52bd8952",
        pinata_secret_api_key: "4b8820acc6d52637b209248707b83cdd2d2dd0ff08d335f6f5dcd946458352fe"
      },
      body: formData,
    });

    const data = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
  } catch (err) {
    console.error("Pinata upload error:", err);
    return null;
  }
};



const GroupChat = ({ gid, messages, sendGroupMessage, loading }) => {

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
      
        const ipfsUrl = await uploadToPinata(file);
        if (!ipfsUrl) return alert("Failed to upload file.");
      
        await sendGroupMessage(gid, ipfsUrl);
      };
      
  const [msg, setMsg] = useState("");

  /* bring in account + nameBook from context */
  const { account, nameBook,groups} = useContext(ChatAppContext);
  const meta = groups.find(g => g.id === gid);
const gname = meta ? meta.name : `Group #${gid}`;
  const myAddr = account?.toLowerCase();

  const handleSend = () => {
    if (!msg.trim()) return;
    sendGroupMessage(gid, msg.trim());
    setMsg("");
  };

  return (

    <div className={Style.pageWrapper}>
            <div className={Style.Chat}>
      {/* HEADER */}
      <div className={Style.Chat_header}>
        <h3>{gname}</h3>
      </div>

      {/* BODY */}
      <div className={Style.Chat_body}>
        {messages.map((m, i) => {
          const sender = m.sender.toLowerCase();
          const isMe   = sender === myAddr;
          const dName  = nameBook[sender] || sender.slice(0, 6);

          return (
            <div key={i} className={isMe ? Style.right : Style.left}>
              <Image src={images.personpic} alt="avatar" width={40} height={40} />

              <div>
                <div className={Style.nameTimeRow}>
                    <span className={Style.name}>{dName}</span>
                    <small className={Style.timestamp}>{convertTime(m.timestamp)}</small>
                </div>
                {m.msg.startsWith("http") && m.msg.includes("ipfs") ? (
                    <img
                        src={m.msg}
                        alt="media"
                        style={{ maxWidth: "300px", borderRadius: "8px", marginTop: "6px" }}
                    />
                    ) : (
                    <p>{m.msg}</p>
                    )}

                </div>
            </div>
          );
        })}
      </div>

      {/* INPUT  */}
      <div className={Style.Chat_inputBox}>
        <input
            type="text"
            placeholder="Type message…"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
        />

        <input
            type="file"
            accept="image/*"
            id="group-media-upload"
            style={{ display: "none" }}
            onChange={handleFileUpload}
        />
        <label htmlFor="group-media-upload">
            <Image src={images.file} alt="upload" width={34} height={34} style={{ cursor: "pointer" }} />
        </label>

        <button onClick={handleSend} disabled={loading || !msg.trim()}  className={Style.sendBtn}>
            {loading ? "…" : "Send"}
        </button>
        </div>


    </div>

</div>

  );
};

export default GroupChat;
