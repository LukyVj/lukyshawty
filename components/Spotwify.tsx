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
import { X, Play, Pause, SkipBack, Music } from "react-feather";

import cx from "classnames";

import style from "./spotwify.module.css";
import { useEffect, useRef, useState } from "react";

import { encode } from "blurhash";

const loadImage = async (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.width = 24;
    img.height = 24;
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
  <div>
    <div className="gcstart-1 gcend-7 d-grid g-2 ggap-16">
      <div className="d-none md:d-block">
        <CustomSearchBox />
      </div>

      <input
        type="search"
        onChange={(event) => searchForItems(event.currentTarget.value)}
        className="w-100p h-40 ph-16 fsz-24 app-none bdw-0 bdr-max"
        placeholder="Search for more artist"
      />
    </div>
    <ul className="d-flex lis-none p-0 m-0 ggap-8">
      {items.map((item) => (
        <li
          key={item.label}
          // style={{ backgroundColor: item.isRefined ? "black" : "#1db954" }}
        >
          <a
            href={createURL(item.value)}
            className={"w-100p h-100p d-block p-8 hover:td-underline"}
            onClick={(event) => {
              event.preventDefault();
              refine(item.value);
            }}
          >
            <small>
              {isFromSearch ? (
                <Highlight attribute="label" hit={item} />
              ) : (
                item.label
              )}{" "}
              <strong>{item.count}</strong>
            </small>
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const CustomRefinementList = connectRefinementList(RefinementList);

const between = (n: number, a: number, b: number) => {
  var min = Math.min(a, b),
    max = Math.max(a, b);

  return n > min && n < max;
};

const Popularity = ({ popularity }) => {
  const [stars, setStars] = useState<any>("");

  useEffect(() => {
    if (between(popularity, 0, 20)) {
      setStars("★☆☆☆☆");
    }
    if (between(popularity, 20, 40)) {
      setStars("★★☆☆☆");
    }
    if (between(popularity, 40, 60)) {
      setStars("★★★☆☆");
    }
    if (between(popularity, 60, 80)) {
      setStars("★★★★☆");
    }
    if (between(popularity, 80, 100)) {
      setStars("★★★★★");
    }
  }, []);
  return <span className="color-theme lsp-big lh-normal">{stars}</span>;
};

const Hit = ({ hit }: any) => {
  const [blurhash, setBlurhash] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [hovered, setHovered] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
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
        "w-100p h-100p obf-cover obp-center m-0 p-0 z-1 op-1 bdr-6";
      imageRef.current.style.transform = "scale(0.7)";
      imageRef.current.style.willChange = "transform";
      imageRef.current.style.transition =
        "opacity .3s ease, transform .2s ease";
      imageRef.current.loading = "lazy";
    }
  }, [blurhash]);

  useEffect(() => {
    if (cardRef?.current && imageRef?.current) {
      cardRef.current.addEventListener("mouseover", () => {
        imageRef.current.style.transform = "scale(0.8)";
      });
      cardRef.current.addEventListener("mouseleave", () => {
        imageRef.current.style.transform = "scale(0.7)";
      });
    }
  });

  return (
    <div
      key={hit.objectID}
      className="bdr-6 color-black fw-bold ov-hidden h-100p"
      ref={cardRef}
      onMouseOver={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
    >
      <div className="h-260">
        {ready && (
          <div className="pos-relative h-100p">
            <div
              className="pos-absolute z-5 right-16 h-auto "
              style={{ bottom: -16 }}
            >
              {[
                {
                  value: isPlaying ? (
                    <Pause width={16} height={16} />
                  ) : (
                    <Play width={16} height={16} />
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
                  value: <SkipBack width={16} height={16} />,
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
                    "app-none bdw-0 w-20 h-20 p-8 cursor-pointer ml-16 d-inline-block mt-16 box-content",
                    style.button,
                    hovered ? style.popIn : style.popOut
                  )}
                >
                  {item.value}
                </button>
              ))}
            </div>

            <div className="pos-absolute z-4 h-100p w-100p bdw-1 bds-solid bdc-black bdtlr-6 bdtrr-6 ov-hidden">
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
        style={{
          height: "calc(100% - 260px)",
        }}
      >
        <header className="mt-16">
          <h4 className="color-white m-0">{hit?.track_name}</h4>
          {hit.artists &&
            Object.values(hit.artists).map((artist: any, index: number) => {
              return (
                <small style={{ color: "#b3b3b3" }}>
                  <a
                    href={`http://open.spotify.com/search/${encodeURI(
                      artist.name
                    )}`}
                    className="td-none color-inherit hover:td-underline"
                    title={`Open spotify search for ${artist.name}`}
                  >
                    {artist.name}
                  </a>
                  {index !== Object.values(hit.artists).length - 1 && ", "}
                </small>
              );
            })}
        </header>
        <article>
          <p>
            <a
              href={hit?.entities?.urls && hit?.entities?.urls[0].expanded_url}
              className="d-flex ai-center color-white hover:color-light-grey hover:td-underline"
            >
              <Music className="stroke-theme mr-8" height={16} /> Listen on
              Spotify
            </a>
          </p>
          <div className="h-40">
            {hit.popularity ? (
              <Popularity popularity={hit.popularity} />
            ) : (
              <p>No data available</p>
            )}
          </div>

          <audio
            src={hit?.preview_url}
            controls
            className="app-none bdr-0 w-100p d-none"
            ref={audioRef}
          />
        </article>
      </div>
    </div>
  );
};

const SetupScreen = ({ setReady }) => {
  const [deleteScreen, setDeleteScreen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeleteScreen(true);
      setReady(true);
    }, 1000);
    return () => clearTimeout(timer);
  });

  return (
    <div
      className={cx(
        "w-100p pos-fixed bgc-black pos-absolute top-0 left-0 z-max ta-center d-flex ai-center jc-center fw-regular",
        `p-${deleteScreen ? 0 : 32}`
      )}
      style={{
        background: "rgba(0,0,0,0.9)",
        zIndex: deleteScreen ? -9999 : 9999,
        height: deleteScreen ? 0 : "100vh",
        opacity: deleteScreen ? 0 : 1,
        transition: "opacity .3s ease",
      }}
    >
      <div className="color-theme">
        <h2>Some things have changed since your last visit</h2>
        <h3>
          Hang on, the app is loading & caching a few things to work faster
        </h3>
      </div>
    </div>
  );
};

const Hits = ({ hits, version, setVersion }) => {
  useEffect(() => {
    if (hits?.[0]?.version !== undefined) {
      setVersion(hits[0].version);
      console.log(version);
    }
  }, [hits]);
  return (
    <div className="d-grid g-2 ggap-16 md:g-4 lg:g-6 pt-16 w-100p">
      {hits.map((hit) => {
        return <Hit key={hit.objectID} hit={hit} />;
      })}
    </div>
  );
};

const CustomHits = connectHits(Hits);

const Spotwify = () => {
  const [version, setVersion] = useState<string>();
  const [splashScreen, setSplashScreen] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    if (version !== undefined) {
      if (localStorage.getItem(`spotwify-v-${version}`)) {
        setSplashScreen(false);
        setReady(true);
      } else {
        localStorage.clear();
        localStorage.setItem(`spotwify-v-${version}`, "1");
        setSplashScreen(true);
      }
    }
  }, [version]);

  return (
    <div className="w-100p mih-100vh">
      {splashScreen && <SetupScreen setReady={setReady} />}
      <InstantSearch searchClient={searchClient} indexName={"SPOTWIFY"}>
        <Configure hitsPerPage={20} />
        <div
          className={cx(
            "pos-sticky top-0 z-5 bgc-black p-24",
            style.header,
            `op-${ready ? 1 : 0}`
          )}
        >
          <div className="d-block md:d-none">
            <CustomSearchBox />
          </div>
          <div className="d-none md:d-block">
            <CustomRefinementList attribute="artists.0.name" />
          </div>
        </div>

        <div
          className={cx(
            "w-100p ov-hidden",
            `op-${ready ? 1 : 0}`,
            style.spotwifyContainer
          )}
        >
          <CustomHits version={version} setVersion={setVersion} />
        </div>

        <Pagination />
      </InstantSearch>
    </div>
  );
};

export default Spotwify;
