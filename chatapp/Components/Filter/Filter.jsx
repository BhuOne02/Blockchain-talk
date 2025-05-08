import React,{useState,useEffect,useContext} from 'react';
import Image from "next/image";


import Style from "./Filter.module.css";
import images from "../../assets";
import { ChatAppContext } from '@/Context/ChatAppContext';
import { Model } from "../index";

const Filter = () => {
  const {account, addFriend}=useContext(ChatAppContext);
  const [addFriendName,setAddFriend]=useState(false);

  return (
    <div className={Style.Filter}>
      <div className={Style.Fitler_box}>
        <div className={Style.Fitler_box_left}>
          <Image src={images.search} alt="image" width={30} height={30}/>
          <input type="text" placeholder="seach....."/>
        </div>

        <div className={Style.Fitler_box_right}>
          <button>
            <Image src={images.trash} alt="clear" height={20} width={20}/>
            CLEAR CHAT
          </button>

          <button onClick={()=>setAddFriend(true)}> 
            <Image src={images.plus} alt="friend" height={20} width={20}/>
             ADD FRIEND
          </button>
        </div>
      </div>

      {addFriendName && (
          <div className={Style.Filter_model}>
            <Model
              openBox={setAddFriend}
              title="WELCOME TO"
              head="CHAT BUDDY"
              info="Bhuvan"
              smallInfo="Select your friend name"
              images={images.logo}
              functionName={addFriend}
              address={""} 
            />
          </div>
      )}
      
    </div>
  )
}

export default Filter
