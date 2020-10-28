import algoliasearch from "algoliasearch/lite";
import {
  connectSearchBox,
  connectHits,
  Configure,
  Highlight,
  Pagination,
  InstantSearch,
  connectRefinementList,
} from "react-instantsearch-dom";
import { slugify } from "../scripts/helpers";
import { BlurhashCanvas } from "react-blurhash";
import useSWR from "swr";

import cx from "classnames";

import style from "./spotwify.module.css";
import { useEffect, useRef, useState } from "react";

import { encode } from "blurhash";

const loadImage = async (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.width = 80;
    img.height = 80;
    img.onload = () => resolve(img);
    img.onerror = (...args) => reject(args);
    img.src = src;
  });

const getImageData = (image) => {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
};

const encodeImageToBlurhash = async (imageUrl) => {
  const image = (await loadImage(imageUrl)) as any;
  const imageData = getImageData(image);
  return encode(imageData.data, imageData.width, imageData.height, 4, 4);
};

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY
);

const SearchBox = ({ currentRefinement, isSearchStalled, refine }) => (
  <form noValidate action="" role="search" className="w-100p d-grid g-6 h-60">
    <input
      type="search"
      value={currentRefinement}
      onChange={(event) => refine(event.currentTarget.value)}
      className="gcstart-1 gcend-5 ph-16 fsz-24 app-none bdc-black bds-solid bdbw-4 bdlw-0 bdtw-0 bdrw-0"
      placeholder="Search for a song"
    />
    <button
      onClick={() => refine("")}
      className="gcstart-5 gcend-7 bgc-transparent color-white app-none bdc-black bds-solid"
    >
      Reset query
    </button>
    {isSearchStalled ? "My search is stalled" : ""}
  </form>
);

const CustomSearchBox = connectSearchBox(SearchBox);
const RefinementList = ({
  items,
  isFromSearch,
  refine,
  searchForItems,
  createURL,
}) => (
  <ul className="d-grid g-6 lis-none p-0 m-0">
    <li className="gcstart-1 gcend-7">
      <input
        type="search"
        onChange={(event) => searchForItems(event.currentTarget.value)}
        className="w-100p h-60 ph-16 fsz-24 app-none bdw-0"
        placeholder="Search for more artist"
      />
    </li>
    {items.map((item) => (
      <li
        key={item.label}
        className="bdw-2 bds-solid"
        style={{ borderColor: item.isRefined ? "black" : "white" }}
      >
        <a
          href={createURL(item.value)}
          style={{
            background: item.isRefined ? "white" : "",
            color: item.isRefined ? "black" : "white",
          }}
          className="w-100p h-100p d-block p-16"
          onClick={(event) => {
            event.preventDefault();
            refine(item.value);
          }}
        >
          {isFromSearch ? (
            <Highlight attribute="label" hit={item} />
          ) : (
            item.label
          )}{" "}
          ({item.count})
        </a>
      </li>
    ))}
  </ul>
);

const CustomRefinementList = connectRefinementList(RefinementList);

const Hit = ({ hit }: any) => {
  const [blurhash, setBlurhash] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const main = async () => {
      // If local storage exists
      if (localStorage.getItem(hit?.track_name)) {
        const savedHash = localStorage.getItem(hit?.track_name);

        setBlurhash(savedHash);
        setReady(true);
      } else {
        const returedBlur = await encodeImageToBlurhash(
          hit?.track_images[1]?.url
        );
        if (returedBlur !== null) {
          localStorage.setItem(hit?.track_name, returedBlur);
          setReady(true);
        }
      }
    };
    main();
  });

  useEffect(() => {
    if (imageRef?.current) {
      imageRef.current.src = hit?.track_images[1]?.url;
      imageRef.current.alt = hit?.track_name;
      imageRef.current.className =
        "w-100p h-100p obf-contain obp-center m-0 p-0 z-1 op-1";
      imageRef.current.style.transform = "scale(0.9)";
      imageRef.current.style.transition = "opacity .3s ease";
      imageRef.current.loading = "lazy";
    }
  }, [blurhash]);

  return (
    <div
      key={hit.objectID}
      className="bgc-white bdr-6 color-black fw-bold ov-hidden"
    >
      <div className="h-260">
        {ready && (
          <div className="pos-relative h-100p">
            {blurhash !== null && (
              <BlurhashCanvas
                hash={blurhash}
                className="pos-absolute z-0 w-100p h-100p"
              />
            )}

            <img ref={imageRef} className="op-0" />
          </div>
        )}
        {!ready && (
          <div className="pos-relative h-100p">
            <div className="bgc-moon h-100p w-100p"></div>
          </div>
        )}
      </div>
      <div className="pos-relative p-16 z-4">
        <header>
          {hit.track_name} by {hit && hit.artists && hit.artists[0].name}
        </header>
        <article>
          <p>
            <a
              href={hit?.entities?.urls && hit?.entities?.urls[0].expanded_url}
              className="bdw-0 bdbw-2 bds-dotted bdc-black"
            >
              🔗 Listen on Spotify
            </a>
          </p>
          <div>
            <label htmlFor={`popularity-${slugify(hit?.track_name)}`}>
              Popularity:
            </label>
            <br />
            <span className="p-8">{hit?.popularity}</span>
            <progress
              value={hit?.popularity}
              max="100"
              id={`popularity-${slugify(hit?.track_name)}`}
            />
          </div>
          <div>
            <label htmlFor={`sample-${slugify(hit?.track_name)}`}>
              Sample:
            </label>

            <audio
              src={hit?.preview_url}
              controls
              className="app-none bdr-0"
            ></audio>
          </div>
        </article>
      </div>
    </div>
  );
};

const Hits = ({ hits }) => {
  return (
    <div className="d-grid g-2 ggap-16 md:g-4 lg:g-6 pt-16">
      {hits.map((hit) => {
        return <Hit key={hit.objectID} hit={hit} />;
      })}
    </div>
  );
};

const CustomHits = connectHits(Hits);

const SetupScreen = () => {
  const [deleteScreen, setDeleteScreen] = useState<boolean>(false);
  useEffect(() => {
    setTimeout(() => {
      setDeleteScreen(true);
    }, 5000);
  });

  return (
    <div
      className="w-100p h-100p pos-absolute bgc-black pos-absolute z-max p-32 ta-center d-flex ai-center jc-center"
      style={{
        background: "rgba(0,0,0,0.9)",
        zIndex: 9999,
        display: deleteScreen ? "none" : "block",
      }}
    >
      <h2>That's your first visit</h2>
      <h3>
        Please wait while some data are loaded ( you'll see this message only
        once ){" "}
      </h3>
    </div>
  );
};

const Spotwify = () => {
  const [visited, setVisited] = useState<boolean | null>(false);

  useEffect(() => {
    if (localStorage.getItem("spotwify-visited") !== null) {
      console.log("YES");
      setVisited(true);
    } else {
      setVisited(false);
      localStorage.setItem("spotwify-visited", "1");
    }
  });
  return (
    <>
      {visited !== true && <SetupScreen />}
      <InstantSearch searchClient={searchClient} indexName={"SPOTWIFY"}>
        <Configure hitsPerPage={20} />
        <div className={cx("pos-sticky top-8 z-5 bgc-black", style.header)}>
          <CustomSearchBox />
          <CustomRefinementList attribute="artists.0.name" />
        </div>

        <CustomHits />

        <Pagination />
      </InstantSearch>
    </>
  );
};

export default Spotwify;
