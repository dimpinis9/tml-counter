export type TomorrowlandStage = {
  id: string;
  name: string;
  shortName: string;
  accent: string;
  glow: string;
  image?: {
    src: string;
    depthSrc?: string;
    alt: string;
    position: string;
  };
};

export const tomorrowlandBelgium2026 = {
  edition: 2026,
  theme: "CONSCIENCIA",
  location: "De Schorre · Boom, Belgium",
  weekends: ["17–19 July 2026", "24–26 July 2026"],
  officialLineupUrl: "https://belgium.tomorrowland.com/en/line-up/?page=stages",
  stages: [
    {
      id: "mainstage",
      name: "MAINSTAGE",
      shortName: "Mainstage",
      accent: "#e0b85f",
      glow: "#9f3f6c",
      image: {
        src: "/images/stages/mainstage-real.jpg",
        alt: "Tomorrowland Mainstage seen across the festival grounds in daylight",
        position: "center center",
      },
    },
    {
      id: "freedom-by-bud",
      name: "FREEDOM BY BUD",
      shortName: "Freedom",
      accent: "#79d4c2",
      glow: "#274f85",
      image: {
        src: "/images/stages/freedom-real.jpg",
        alt: "Tomorrowland Freedom indoor stage illuminated in blue",
        position: "center center",
      },
    },
    {
      id: "planaxis",
      name: "PLANAXIS",
      shortName: "Planaxis",
      accent: "#66d7df",
      glow: "#1e4477",
      image: {
        src: "/images/stages/planaxis-real.jpg",
        alt: "Tomorrowland Planaxis stage surrounded by the crowd",
        position: "center center",
      },
    },
    {
      id: "atmosphere",
      name: "ATMOSPHERE",
      shortName: "Atmosphere",
      accent: "#d0d4da",
      glow: "#393d48",
      image: {
        src: "/images/stages/atmosphere-real.jpg",
        alt: "Tomorrowland Atmosphere stage during a laser show",
        position: "center center",
      },
    },
    {
      id: "crystal-garden",
      name: "CRYSTAL GARDEN",
      shortName: "Crystal Garden",
      accent: "#7fd8be",
      glow: "#256875",
      image: {
        src: "/images/stages/crystal-garden-real.jpg",
        alt: "Tomorrowland Crystal Garden stage in daylight",
        position: "center center",
      },
    },
    {
      id: "the-rose-garden",
      name: "THE ROSE GARDEN",
      shortName: "Rose Garden",
      accent: "#e77698",
      glow: "#8f294e",
    },
    {
      id: "elixir",
      name: "ELIXIR",
      shortName: "Elixir",
      accent: "#9fdb72",
      glow: "#2f6f53",
    },
    {
      id: "cage",
      name: "CAGE",
      shortName: "Cage",
      accent: "#ded7c8",
      glow: "#4d5367",
    },
    {
      id: "the-rave-cave",
      name: "THE RAVE CAVE",
      shortName: "Rave Cave",
      accent: "#f18b54",
      glow: "#712b45",
    },
    {
      id: "melodia-by-corona",
      name: "MELODIA BY CORONA",
      shortName: "Melodia",
      accent: "#f2c55c",
      glow: "#c06b2f",
    },
    {
      id: "celestia-by-kucoin",
      name: "CELESTIA BY KUCOIN",
      shortName: "Celestia",
      accent: "#a9b8ff",
      glow: "#542f81",
    },
    {
      id: "core",
      name: "CORE",
      shortName: "CORE",
      accent: "#86ca85",
      glow: "#225c42",
    },
    {
      id: "the-great-library",
      name: "THE GREAT LIBRARY",
      shortName: "Great Library",
      accent: "#d6a95c",
      glow: "#763c32",
    },
    {
      id: "moose-bar",
      name: "MOOSE BAR",
      shortName: "Moose Bar",
      accent: "#efb56b",
      glow: "#81462d",
    },
    {
      id: "house-of-fortune-by-jbl",
      name: "HOUSE OF FORTUNE BY JBL",
      shortName: "House of Fortune",
      accent: "#f1814a",
      glow: "#874136",
    },
  ] satisfies TomorrowlandStage[],
} as const;
