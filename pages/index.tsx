import Head from "next/head";
import Spotwify from "../components/Spotwify";

import cx from "classnames";

import style from "./index.module.css";

const Home = () => {
  return (
    <div className={cx("p-8", style.pageWrapper)}>
      <Head>
        <title>LukyVj playlist - @LukyShawty</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Spotwify />
      </main>

      <footer className="p-8 ta-center">
        These data are fetched from{" "}
        <a href="https://twittter.com/LukyShawty">twitter.com/LukyShawty</a> -
        Search experience using <a href="https://algolia.com">Algolia</a> -
        Hosted on <a href="https://vercel.com">▲ Vercel</a>
      </footer>
    </div>
  );
};
export default Home;
