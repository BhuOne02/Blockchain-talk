import React, { useState, useContext } from 'react';
import Image from "next/image";

import Style from './Model.module.css';
import { ChatAppContext } from '@/Context/ChatAppContext';
import images from "../../assets";
import { Loader } from "../index";

const Model = ({ openBox, title, head, info, smallInfo, images: modalImage, functionName, address }) => {
  const [name, setName] = useState("");
  const [accountAddress, setAccountAddress] = useState("");

  const { loading } = useContext(ChatAppContext);

  return (
    <div className={Style.Model}>
      <div className={Style.Model_box}>
        
        {/* Left Side */}
        <div className={Style.Model_box_left}>
          <Image src={modalImage} alt="modal-graphic" width={300} height={300} />
        </div>

        {/* Right Side */}
        <div className={Style.Model_box_right}>
          <h1>{title} <span>{head}</span></h1>
          <p>{info}</p>
          <small>{smallInfo}</small>

          {
            loading==true?(
            <Loader/>):(
              <div className={Style.Model_box_right_name}>
              {/* Name Input */}
              <div className={Style.Model_box_right_info}>
                <Image src={images.user} alt="user" width={30} height={30} />
                <input
                  type="text"
                  placeholder="Enter Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
  
              {/* Address Input */}
              <div className={Style.Model_box_right_info}>
                <Image src={images.user} alt="user" width={30} height={30} />
                <input
                  type="text"
                  placeholder={address || "Enter Address"}
                  value={accountAddress}
                  onChange={(e) => setAccountAddress(e.target.value)}
                />
              </div>
  
              {/* Buttons */}
              <div className={Style.Model_box_right_name_btn}>
                <button onClick={() => functionName(name)}>
                  <Image src={images.user} alt="submit" width={30} height={30} />
                  Submit
                </button>
  
                <button onClick={() => openBox(false)}>
                  <Image src={images.user} alt="cancel" width={30} height={30} />
                  Cancel
                </button>
              </div>
  
    
            </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default Model;
