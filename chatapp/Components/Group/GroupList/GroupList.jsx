// Components/Group/GroupList.jsx
import React, { useState } from "react";
import GroupCard from "../GroupCard/GroupCard";
import CreateGroupModal from "../CreateGroup/CreateGroupModal";
import Styles from "./GroupList.module.css";

const GroupList = ({ groups, openGroup, currentGroupId }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* header */}
      <div className={Styles.header}>
        <h4>Groups</h4>
        <button className={Styles.newBtn} onClick={() => setShowModal(true)}>
          + New Group
        </button>
      </div>

      {/* list */}
      <div className={Styles.list}>
        {groups.length === 0 ? (
          <p className={Styles.empty}>No groups yet</p>
        ) : (
          groups.map((g, i) => (
            <GroupCard
              key={i}
              group={g}
              openGroup={openGroup}
              active={g.id === currentGroupId}
            />
          ))
        )}
      </div>

      {/* modal */}
      {showModal && <CreateGroupModal close={() => setShowModal(false)} />}
    </>
  );
};

export default GroupList;
