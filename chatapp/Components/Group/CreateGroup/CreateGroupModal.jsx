import React, { useContext, useState } from "react";
import Style from "./CreateGroupModal.module.css";
import { ChatAppContext } from "@/Context/ChatAppContext";

const CreateGroupModal = ({ close }) => {
  const { friendLists, createGroup, loading } = useContext(ChatAppContext);

  const [groupName, setGroupName] = useState("");
  const [selected, setSelected]   = useState({}); // addr ⇒ bool

  const toggle = addr =>
    setSelected(prev => ({ ...prev, [addr]: !prev[addr] }));

  const handleCreate = async () => {
    const members = Object.keys(selected).filter(k => selected[k]);
    if (!groupName || !members.length) {
      alert("Please enter a group name and choose members.");
      return;
    }
    await createGroup(groupName, members);
    close();
  };

  return (
    <div className={Style.backdrop}>
      <div className={Style.modal}>
        <h3 className={Style.title}>Create New Group</h3>

        <label className={Style.label}>
          Group name
          <input
            className={Style.groupNameInput}
            placeholder="e.g. Study Buddies"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </label>

        <div className={Style.memberLabel}>Select members</div>
        <div className={Style.list}>
          {friendLists.length === 0 ? (
            <p className={Style.noFriends}>You have no friends yet 🤝</p>
          ) : (
            friendLists.map(f => (
              <label key={f.pubkey} className={Style.item}>
                <input
                  type="checkbox"
                  checked={!!selected[f.pubkey]}
                  onChange={() => toggle(f.pubkey)}
                />
                <span>{f.name}</span>
              </label>
            ))
          )}
        </div>

        <div className={Style.btnRow}>
          <button
            className={`${Style.btn} ${Style.createBtn}`}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Creating…" : "Create Group"}
          </button>

          <button
            className={`${Style.btn} ${Style.cancelBtn}`}
            onClick={close}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
