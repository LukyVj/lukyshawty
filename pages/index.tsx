import Head from "next/head";

import Spotwify from "../components/Spotwify";
const Home = () => {
  return (
    <div className="yolo">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="yolo">
        <Spotwify />
      </main>

      <footer className="yolo"></footer>
    </div>
  );
};
export default Home;
