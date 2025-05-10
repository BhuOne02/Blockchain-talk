// Components/Group/GroupChat.jsx
import React, { useState, useContext } from "react";
import Image  from "next/image";
import Style  from "./GroupChat.module.css";
import images from "../../../assets";          // adjust if your assets path differs
import { convertTime } from "@/Utils/apiFeature";
import { ChatAppContext } from "@/Context/ChatAppContext";

const GroupChat = ({ gid, messages, sendGroupMessage, loading }) => {
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
                <p>{m.msg}</p>
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

        <button onClick={handleSend} disabled={loading || !msg.trim()}>
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
};

export default GroupChat;
