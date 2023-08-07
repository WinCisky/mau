import type { Episode } from "$lib/db_helper";
import type { PageLoad } from "./$types";
import PocketBase from "pocketbase";

export const load = (async ({params}) => {
    const { anime, episode } = params;
    const pb = new PocketBase("https://dev.opentrust.it/");

    const resultList = await pb.collection('mau_episodes').getFullList({
        filter: `(anime.slug="${anime}")`,
        expand: "anime",
    });
  
    return { "episodes": resultList as unknown as Episode[] };
  }) satisfies PageLoad;
  