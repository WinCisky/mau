import type { PageLoad } from "./$types";
import PocketBase from "pocketbase";

export const load = (async ({params}) => {
    const { anime, episode } = params;
    const pb = new PocketBase("https://dev.opentrust.it/");

    const resultList = await pb.collection('mau_episodes').getFullList({
        filter: `(anime.slug="${anime}")`,
        expand: "anime",
    });
  
    return { "episodes": resultList };
  }) satisfies PageLoad;
  