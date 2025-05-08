import React, { useState, useContext } from 'react';
import Image from "next/image";
import Link from "next/link";

import Style from './NavBar.module.css';
import { ChatAppContext } from '@/Context/ChatAppContext';
import images from "../../assets";
import { Model, Error } from "../index";

const NavBar = () => {
  const menuItems = [
    { menu: "All Users", link: "/allusers" },
    { menu: "Chat", link: "/" },
    { menu: "Group Chat", link: "/" },
    { menu: "Settings", link: "/" },
  ];

  const [active, setActive] = useState(2);
  const [openModel, setOpenModel] = useState(false);
  const [open, setOpen] = useState(false);

  const { account, userName, connectWallet, createAccount, error } = useContext(ChatAppContext);

  return (
    <>
      <div className={Style.NavBar}>
        <div className={Style.NavBar_box}>
          {/* Left: Logo */}
          <div className={Style.NavBar_box_left}>
            <Image src={images.logo} alt="Logo" width={50} height={50} />
          </div>

          {/* Right: Menu + Buttons */}
          <div className={Style.NavBar_box_right}>
            {/* Menu */}
            <div className={Style.NavBar_box_right_menu}>
              {menuItems.map((el, i) => (
                <div
                  key={i}
                  onClick={() => setActive(i + 1)}
                  className={`
                    ${Style.NavBar_box_right_menu_items} 
                    ${active === i + 1 ? Style.active_btn : ""}
                  `}
                >
                  <Link href={el.link} className={Style.NavBar_box_right_menu_items_link}>
                    {el.menu}
                  </Link>
                </div>
              ))}
            </div>

            {/* Connect Wallet */}
            <div className={Style.NavBar_box_right_connect}>
              {account === "" ? (
                <button onClick={connectWallet}>
                  <span>Connect Wallet</span>
                </button>
              ) : (
                <button onClick={() => setOpenModel(true)}>
                  <Image src={images.user} alt="User" width={25} height={25} />
                  <small>{userName || "Create Account"}</small>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal for Create Account */}
        {openModel && (
          <div className={Style.modelBox}>
            <Model
              openBox={setOpenModel}
              title="WELCOME TO"
              head="BlockTalk"
              info="Create your account"
              images={images.logo}
              functionName={createAccount}
              address={account}
            />
          </div>
        )}
      </div>

      {/* Error Component */}
      {error !== "" && <Error error={error} />}
    </>
  );
};

export default NavBar;
