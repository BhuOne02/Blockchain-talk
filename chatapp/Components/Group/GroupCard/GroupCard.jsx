// Components/Group/GroupCard.jsx
import React, { useContext } from "react";
import Link from "next/link";
import Style from "./GroupCard.module.css";
import { ChatAppContext } from "@/Context/ChatAppContext";

const GroupCard = ({ group, active }) => {
  const { setCurrentGroup, readGroupMessages } = useContext(ChatAppContext);

  /* instant-update on click */
  const handleClick = async () => {
    setCurrentGroup(group.id);
    await readGroupMessages(group.id);
  };

  return (
    <Link
      href={`/group/${group.id}`}     //  ← router URL
      className={`${Style.card} ${active ? Style.active : ""}`}
      onClick={handleClick}           //  ← instant state update
    >
      <h4>{group.name}</h4>
      <small>{group.members.length} members</small>
    </Link>
  );
};

export default GroupCard;
