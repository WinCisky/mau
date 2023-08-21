import type PocketBase from "pocketbase";

export async function searchAnime(pb: PocketBase, searchText: string) {
    const resultList = await pb.collection("mau_anime").getList(1, 20, {
        filter: `title_eng ~ '${searchText}' || title ~ '${searchText}'`,
        sort: "visite",
    });
    return resultList.items.map((item) => {
        return item as unknown as Anime;
    });
}

export async function getLatestEpisodes(pb: PocketBase, page: number = 1) {

    let ona = true;
    let dub = true;
    let filter = "public=1";

    if (typeof localStorage != "undefined") {
        const user_settings = localStorage.getItem("user_settings");
        if (user_settings != null) {
            const user_settings_json = JSON.parse(user_settings);
            if ("ona" in user_settings_json) {
                ona = user_settings_json.ona;
            }
            if ("dub" in user_settings_json) {
                dub = user_settings_json.dub;
            }
            if (!ona) {
                filter += " && anime.type!='ONA'";
            }
            if (!dub) {
                filter += " && anime.dub=0";
            }
        }
    }

    return pb.collection('mau_episodes').getList(page, 30, {
        sort: "-upload",
        expand: "anime",
        filter: filter,
    });
}

export interface Episode {
    anime: string
    anime_id: number
    collectionId: string
    collectionName: string
    created: string
    expand: Expand
    file_name: string
    hidden: number
    id: string
    link: string
    mau_id: number
    number: number
    public: number
    scws_id: number
    tg_post: number
    updated: string
    upload: string
    user_id: number
    visite: number
  }
  
  export interface Expand {
    anime: Anime
  }
  
  export interface Anime {
    always_home: number
    anilist_id: number
    author: string
    collectionId: string
    collectionName: string
    cover: string
    created: string
    date: string
    day: string
    dub: number
    episodes_count: number
    episodes_length: number
    favorites: number
    id: string
    imageurl: string
    imageurl_cover: string
    mal_id: number
    mau_id: number
    members: number
    plot: string
    score: string
    season: string
    slug: string
    status: string
    studio: string
    title: string
    title_eng: string
    title_it: string
    type: string
    updated: string
    user_id: number
    visite: number
  }