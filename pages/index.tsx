import Head from "next/head";

import Spotwify from "../components/Spotwify";
const Home = () => {
  return (
    <div className="p-8">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-8">
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
