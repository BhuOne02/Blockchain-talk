//_app.js


import "@/styles/globals.css";

import { ChatAppProvider } from "@/Context/ChatAppContext";
import { NavBar } from "@/Components/index";

const MyApp = ({ Component, pageProps }) => (
  <ChatAppProvider>
    <NavBar />
    <Component {...pageProps} />
  </ChatAppProvider>
);
export default MyApp;







