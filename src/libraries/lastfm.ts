type TextItem<T1 extends string, T2 = string> = {
  [K in T1]: T2;
} & {
  "#text": string;
};

interface TrackInfoResponse {
  track: {
    name: string;
    url: string;
    duration: string;
    streamable: TextItem<"fulltrack">;
    listeners: string;
    playcount: string;
    artist: {
      name: string;
      mbid?: string;
      url: string;
    };
    album?: {
      artist: string;
      title: string;
      url: string;
      image: TextItem<"size", "small" | "medium" | "large" | "extralarge">[];
    };
    toptags: {
      tag: {
        name: string;
        url: string;
      }[];
    };
  };
}

interface ResponseAttr {
  user: string;
  totalPages: string;
  page: string;
  perPage: string;
  total: string;
}

interface RecentTracksResponse {
  recenttracks: {
    track: {
      artist: TextItem<"mbid">;
      streamable: string;
      image: TextItem<"size", "small" | "medium" | "large" | "extralarge">[];
      mbid: string;
      album: TextItem<"mbid">;
      name: string;
      url: string;
      date?: TextItem<"uts">;
      "@attr"?: { nowplaying: string };
    }[];
    "@attr": ResponseAttr;
  };
}

interface TopTracksResponse {
  toptracks: {
    track: {
      streamable: TextItem<"fulltrack">;
      mbid: string;
      name: string;
      image: TextItem<"size", "small" | "medium" | "large" | "extralarge">[];
      artist: {
        url: string;
        name: string;
        mbid: string;
      };
      url: string;
      duration: string;
      "@attr": {
        rank: string;
      };
      playcount: string;
    }[];
    "@attr": ResponseAttr;
  };
}

type Period = "overall" | "7day" | "1month" | "3month" | "6month " | "12month";

export function isPeriod(period: string): period is Period {
  return ["overall", "7day", "1month", "3month", "6month ", "12month"].includes(
    period
  );
}

interface TrackItemBase {
  name: string;
  artist: string;
  image: string;
  url: string;
}
export interface RecentTrackItem extends TrackItemBase {
  nowplaying: boolean;
}
export interface TopTrackItem extends TrackItemBase {
  playcount: number;
}

export async function getTrackInfo(
  apiKey: string,
  track: string,
  artist: string
) {
  const cache = await caches.open("lastfm-cache");

  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("method", "track.getinfo");
  url.searchParams.set("track", track);
  url.searchParams.set("artist", artist);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");

  const cachedResponse = await cache.match(url);
  if (cachedResponse) {
    const cachedData = await cachedResponse.json<TrackInfoResponse>();
    return cachedData.track;
  }

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  await cache.put(url, response.clone());

  const data = await response.json<TrackInfoResponse>();
  return data.track;
}

export async function getRecentTracks(
  apiKey: string,
  user: string,
  limit: number
): Promise<RecentTrackItem[]> {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("method", "user.getrecenttracks");
  url.searchParams.set("user", user);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  const data = await response.json<RecentTracksResponse>();
  return data.recenttracks.track.map((track) => ({
    name: track.name,
    artist: track.artist["#text"],
    image: track.image[1]["#text"],
    url: track.url,
    nowplaying: !!track["@attr"]?.nowplaying,
  }));
}

export async function getTopTracks(
  apiKey: string,
  user: string,
  limit: number,
  period: Period
): Promise<TopTrackItem[]> {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("method", "user.gettoptracks");
  url.searchParams.set("user", user);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("period", period);
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  const data = await response.json<TopTracksResponse>();
  return data.toptracks.track.map((track) => ({
    name: track.name,
    artist: track.artist.name,
    image: track.image[1]["#text"],
    url: track.url,
    playcount: Number.parseInt(track.playcount),
  }));
}
