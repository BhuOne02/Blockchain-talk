import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { ChatAppContext } from "@/Context/ChatAppContext";
import Group from "@/Components/Group/Group";          // the wrapper

export default function GroupPage() {
  const { openGroup } = useContext(ChatAppContext);
  const router = useRouter();
  const gid = router.query.gid;

  // On first load (or route change) open the group
  useEffect(() => {
    if (gid) openGroup(Number(gid));
  }, [gid]);

  return <Group />;         // Group shows GroupChat internally
}
