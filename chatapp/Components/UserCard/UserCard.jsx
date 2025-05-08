import React from 'react'
import Image from "next/image"


import Style from "./UserCard.module.css";
import images from "../../assets";

const UserCard = ({el,i,addFriend}) => {
  console.log(el);
  return (
    <div className={Style.UserCard}>
      <div className={Style.UserCard_box} >
        <Image src={images.logo} alt="user" width={100} height={100}/>
      </div>

      <div className={Style.UserCard_box_info}>
        <h3>{el.name}</h3>
        <p> {el.accountAddress}</p>
        <button onClick={()=>addFriend({accountAddress:el.accountAddress,name:el.name})}>
          Add Friend

        </button>
      </div>
      
    </div>
  )
}

export default UserCard
