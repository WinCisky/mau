import { getCurrentSeason } from "$lib";
import type PocketBase from "pocketbase";

const summer = "Estate";
const winter = "Inverno";
const spring = "Primavera";
const fall = "Autunno";

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
    let filter = "public=1";

    if (pb.authStore.model != null) {
        const settings = await getUserSettings(pb);

        if (settings != null) {
            const ona = settings.ona;
            const dub = settings.dub;
            const nsfw = settings.nsfw;
            if (!ona) {
                filter += " && anime.type!='ONA'";
            }
            if (!dub) {
                filter += " && anime.dub=0";
            }
            if (!nsfw) {
                filter += " && anime.nsfw!='gray'";
            }
        }
    } else {
        filter += " && anime.nsfw!='gray'";
    }

    return pb.collection('mau_episodes').getList(page, 30, {
        sort: "-upload",
        expand: "anime",
        filter: filter,
    });
}

export async function getLatestFollowedEpisodes(pb: PocketBase, page: number = 1) {

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

    // TODO: if too slow imprtve with a join

    const user_id = pb.authStore.model?.id;

    // get followed anime
    const followed_anime = await pb.collection('mau_follows').getList(1, 100, {
        filter: `user_id='${user_id}'`,
    });

    const anime = [];

    for (const followed of followed_anime.items) {
        const anime_episodes = await pb.collection('mau_episodes').getList(page, 1, {
            filter: `anime.mal_id='${followed.mal_id}' && ${filter}`,
            sort: "-upload",
            expand: "anime",
        });
        if (anime_episodes.items.length > 0) {
            anime.push(anime_episodes.items[0]);
        }
    }

    // sort by upload date
    anime.sort((a, b) => {
        return b.upload.localeCompare(a.upload);
    });

    return anime;
}

export async function getUserSettings(pb: PocketBase) {
    if (pb.authStore.model == null) {
        return null;
    }

    const user_id = pb.authStore.model?.id;
    const user_settings = await pb.collection('mau_users').getList(1, 1, {
        filter: `user='${user_id}'`,
    });

    if (user_settings.items.length == 0) {
        return null;
    }

    return user_settings.items[0];
}

export async function setUserSettings(pb: PocketBase, settings: UserSettings) {
    if (pb.authStore.model == null) {
        return null;
    }

    const user_id = pb.authStore.model?.id;
    // do not change user
    settings.user = user_id;
    const user_settings = await pb.collection('mau_users').getList(1, 1, {
        filter: `user='${user_id}'`,
    });

    if (user_settings.items.length == 0) {
        return null;
    }

    await pb.collection('mau_users').update(user_settings.items[0].id, settings);
}

async function createUserSettings(pb: PocketBase, settings: UserSettings) {
    if (pb.authStore.model == null) {
        return null;
    }

    const user_id = pb.authStore.model?.id;
    const user_settings = await pb.collection('mau_users').getList(1, 1, {
        filter: `user='${user_id}'`,
    });

    if (user_settings.items.length == 0) {
        await pb.collection('mau_users').create(settings);
    }
}

export async function setUserTheme(pb: PocketBase, theme: string) {
    const user_id = pb.authStore.model?.id;
    const user_settings = await getUserSettings(pb);
    if (user_id == null || user_settings == null) {
        return;
    }

    if (!user_settings) {
        const default_settings = new UserSettingsDefaults();
        default_settings.user = user_id;
        default_settings.theme = theme;
        await createUserSettings(pb, default_settings);
    } else {
        await pb.collection('mau_users').update(user_settings.id, {
            theme: theme,
        });
    }

    // const user_settings = await pb.collection('mau_users').update('');
}

export async function getTopAllTimeAnime(pb: PocketBase, page: number = 1) {
    return pb.collection('mau_anime').getList(page, 20, {
        filter: `visite > 10000`,
        sort: '-score',
    });
}

export async function getTopSeasonalAnime(pb: PocketBase, page: number = 1) {
    // const year = new Date().getFullYear();
    // const season = getCurrentSeason(winter, spring, summer, fall);
    // console.log(season);
    // return pb.collection('mau_anime').getList(page, 20, {
    //     filter: `season='${season}' && date = "${year}"`,
    //     sort: '-score',
    // });

    // https://dev.opentrust.it/api/mau/classific/seasonal
    const classificSeasonal = await fetch(`https://dev.opentrust.it/api/mau/classific/seasonal/${page}`);
    return classificSeasonal.json();
}

export async function getTopPopularAnime(pb: PocketBase, page: number = 1) {
    return pb.collection('mau_anime').getList(page, 20, {
        filter: `visite > 10000`,
        sort: '-visite',
    });
}

export async function getAnimeEpisodesCount(pb: PocketBase, anime_id: number) {
    const { totalItems } = await pb.collection('mau_episodes').getList(1, 1, {
        filter: `anime.mau_id=${anime_id}`,
    });
    return totalItems;
}

interface UserSettings {
    user: string;
    ona: boolean;
    dub: boolean;
    mirror: boolean;
    volume: number;
    theme: string;
}

export class UserSettingsDefaults implements UserSettings {
    user = '';
    ona = true;
    dub = true;
    mirror = true;
    nsfw = false;
    volume = 1;
    theme = 'default';
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