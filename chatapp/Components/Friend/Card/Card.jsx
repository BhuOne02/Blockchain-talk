import React, { useContext } from 'react';
import Image from "next/image";
import Link from "next/link";

import Style from "./Card.module.css";
import images from "../../../assets";

const Card = ({ el, i, readMessage, readUser }) => {
  return (
    <Link
      href={{
        pathname: "/",
        query: { name: el.name, address: el.pubkey },
      }}
    >
      <div
        className={Style.Card}
        onClick={() => {
          readMessage(el.pubkey);
          readUser(el.pubkey);
        }}
      >
        <div className={Style.Card_box}>
          <div className={Style.Card_box_left}>
            <Image
              src={images.friendname}
              alt="username"
              height={50}
              width={50}
              className={Style.Card_box_left_img}
            />
          </div>

          <div className={Style.Card_box_right}>
            <div className={Style.Card_box_right_middle}>
              <h4>{el.name}</h4>
              <small>{el.pubkey.slice(0, 6)}...{el.pubkey.slice(-4)}</small>
            </div>

            <div className={Style.Card_box_right_end}>
              <small>{i + 1}</small>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Card;
