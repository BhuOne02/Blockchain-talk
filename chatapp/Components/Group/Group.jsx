import React, { useContext, useEffect } from "react";
import Styles      from "./Group.module.css";
import GroupList   from "./GroupList/GroupList";
import GroupChat   from "./GroupChat/GroupChat";
import { ChatAppContext } from "@/Context/ChatAppContext";

const Group = () => {
  const {
    groups,
    currentGroup,          // ← active id
    openGroup,
    groupMessages,
    sendGroupMessage,
    userName,
    account,
    loading,
    fetchMyGroups,
  } = useContext(ChatAppContext);

  /* fetch groups once the wallet address is ready */
  useEffect(() => {
    if (account) fetchMyGroups();
  }, [account]);

  return (
    <div className={Styles.Group}>
      <div className={Styles.Group_box}>
        {/* sidebar */}
        <div className={Styles.Group_box_left}>
          <GroupList
            groups={groups}
            openGroup={openGroup}
            currentGroupId={currentGroup}     /* highlight active  */
          />
        </div>

        {/* chat window */}
        <div className={Styles.Group_box_right}>
        {currentGroup !== undefined && currentGroup !== null ? (
            <GroupChat
            gid={currentGroup}
            messages={groupMessages}
            sendGroupMessage={sendGroupMessage}
            loading={loading}
            userName={userName}
            account={account}
            />
        ) : (
            <div className={Styles.placeholder}>Select a group</div>
        )}
        </div>



      </div>
    </div>
  );
};

export default Group;
