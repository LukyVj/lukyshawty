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
import { X, Play, Pause, SkipBack } from "react-feather";

import cx from "classnames";

import style from "./spotwify.module.css";
import { useEffect, useRef, useState } from "react";

import { encode } from "blurhash";

const loadImage = async (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.width = 32;
    img.height = 32;
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
  <form
    noValidate
    action=""
    role="search"
    className="w-100p pos-relative mb-16 p-0 m-0"
  >
    <input
      type="search"
      value={currentRefinement}
      onChange={(event) => refine(event.currentTarget.value)}
      className="ph-16 h-40 fsz-24 w-100p app-none bdc-black bds-solid bdbw-4 bdlw-0 bdtw-0 bdrw-0 bdr-max"
      placeholder="Search for a song"
      style={{ lineHeight: "40px" }}
    />

    <button
      className="pos-absolute top-0 right-0 app-none h-100p w-32 bgc-transparent bdw-0 fsz-24 ph-16 pv-0 va-middle"
      style={{ lineHeight: "40px" }}
      onClick={() => refine("")}
    >
      <X />
    </button>
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
  <ul className="d-grid g-6 lis-none p-0 m-0 ggap-8">
    <li className="gcstart-1 gcend-7 d-grid g-2 ggap-16">
      <div className="d-none md:d-block">
        <CustomSearchBox />
      </div>

      <input
        type="search"
        onChange={(event) => searchForItems(event.currentTarget.value)}
        className="w-100p h-40 ph-16 fsz-24 app-none bdw-0 bdr-max"
        placeholder="Search for more artist"
      />
    </li>
    {items.map((item) => (
      <li
        key={item.label}
        className={cx(
          "bdw-2 bds-solid",
          style.button,
          item.isRefined && style.buttonActive
        )}
        style={{ backgroundColor: item.isRefined ? "black" : "#1db954" }}
      >
        <a
          href={createURL(item.value)}
          className={"w-100p h-100p d-block p-16"}
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

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
        "w-100p h-100p obf-cover obp-center m-0 p-0 z-1 op-1";
      imageRef.current.style.transform = "scale(0.9)";
      imageRef.current.style.transition = "opacity .3s ease";
      imageRef.current.loading = "lazy";
    }
  }, [blurhash]);

  return (
    <div
      key={hit.objectID}
      className="bdr-6 color-black fw-bold ov-hidden h-100p"
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

            <img
              ref={imageRef}
              className="op-0"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}
            />
          </div>
        )}
        {!ready && (
          <div className="pos-relative h-100p">
            <div className="bgc-moon h-100p w-100p"></div>
          </div>
        )}
      </div>
      <div
        className={cx(
          "pos-relative p-16 z-4 bdlw-1 bdrw-1 bdbw-1 bds-solid bdc-black bdtw-0 color-theme bdblr-6 bdbrr-6 color-light-grey fw-normal",
          style.card
        )}
      >
        <header>
          <h4 className="color-white m-0">{hit?.track_name}</h4>
          <small style={{ color: "#b3b3b3" }}>{hit?.artists[0]?.name}</small>
        </header>
        <article>
          <p>
            <a
              href={hit?.entities?.urls && hit?.entities?.urls[0].expanded_url}
              className="bdw-0 bdbw-2 bds-dotted bdc-theme"
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
              30 seconds sample:
            </label>

            <audio
              src={hit?.preview_url}
              controls
              className="app-none bdr-0 w-100p d-none"
              ref={audioRef}
            ></audio>

            <div className="d-grid g-4 ggap-8 pv-16">
              {[
                {
                  value: isPlaying ? (
                    <Pause />
                  ) : (
                    <Play width={20} height={20} />
                  ),
                  action: () => {
                    if (audioRef?.current) {
                      if (audioRef.current.paused) {
                        audioRef.current.play();
                        setIsPlaying(true);
                      } else {
                        audioRef.current.pause();
                        setIsPlaying(false);
                      }
                    }
                  },
                },
                {
                  value: <SkipBack width={20} height={20} />,
                  action: () => {
                    if (audioRef?.current) {
                      audioRef.current.pause();
                      audioRef.current.currentTime = 0;
                    }
                  },
                },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => item.action()}
                  className={cx(
                    "app-none bdw-0 p-8 cursor-pointer",
                    style.button
                  )}
                >
                  {item.value}
                </button>
              ))}
            </div>
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
      <h2>Some things have changed since your last visit</h2>
      <h3>Hang on</h3>
    </div>
  );
};

const Spotwify = () => {
  const [visited, setVisited] = useState<boolean | null>(false);

  useEffect(() => {
    const projectVersion = 2;
    if (localStorage.getItem(`spotwify-visited-v-${projectVersion - 1}`)) {
      localStorage.clear();
    }
    if (localStorage.getItem(`spotwify-visited-v-${projectVersion}`) !== null) {
      console.log("YES");
      setVisited(true);
    } else {
      setVisited(false);
      localStorage.setItem(`spotwify-visited-v-${projectVersion}`, "1");
    }
  });
  return (
    <>
      {visited !== true && <SetupScreen />}
      <InstantSearch searchClient={searchClient} indexName={"SPOTWIFY"}>
        <Configure hitsPerPage={20} />
        <div
          className={cx("pos-sticky top-0 z-5 bgc-black p-24", style.header)}
          style={{ marginLeft: "-16px", width: "calc(100% + 32px)" }}
        >
          <div className="d-block md:d-none">
            <CustomSearchBox />
          </div>
          <div className="d-none md:d-block">
            <CustomRefinementList attribute="artists.0.name" />
          </div>
        </div>

        <CustomHits />

        <Pagination />
      </InstantSearch>
    </>
  );
};

export default Spotwify;
