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

import cx from "classnames";

import style from "./spotwify.module.css";

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

const Hits = ({ hits }) => {
  return (
    <div className="d-grid g-2 ggap-16 md:g-4 lg:g-6 pt-16">
      {hits.map((hit) => {
        if (
          !hit.objectID.includes("undefined") &&
          hit.track_images &&
          hit.track_images.length > 0
        ) {
          console.log(hit, hit.track_name, hit.popularity);
          return (
            <div
              key={hit.objectID}
              className="bgc-white bdr-6 color-black fw-bold ov-hidden"
            >
              <div className="pos-relative">
                {hits.blur_hash && (
                  <BlurhashCanvas
                    hash={hit.blur_hash}
                    className="pos-absolute z-0 w-100p h-100p"
                  />
                )}
                <img
                  src={
                    hit.track_images &&
                    hit.track_images[1] &&
                    hit.track_images[1].url
                  }
                  alt={hit.track_name}
                  className="w-100p h-100p obf-cover obp-center m-0 p-0 z-1"
                  style={{ transform: "scale(0.9)" }}
                  loading="lazy"
                />
              </div>
              <div className="pos-relative p-16 z-4">
                <header>
                  {hit.track_name} by{" "}
                  {hit && hit.artists && hit.artists[0].name}
                </header>
                <article>
                  <p>
                    <a
                      href={
                        hit?.entities?.urls &&
                        hit?.entities?.urls[0].expanded_url
                      }
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
        }
      })}
    </div>
  );
};

const CustomHits = connectHits(Hits);
const Spotwify = () => {
  return (
    <InstantSearch searchClient={searchClient} indexName={"SPOTWIFY"}>
      <Configure hitsPerPage={40} />
      <div className={cx("pos-sticky top-8 z-5 bgc-black", style.header)}>
        <CustomSearchBox />
        <CustomRefinementList attribute="artists.0.name" />
      </div>
      <CustomHits />
      <Pagination />
    </InstantSearch>
  );
};

export default Spotwify;
