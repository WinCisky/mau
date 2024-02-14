import type { Episode } from "$lib/db_helper";
import type { PageLoad } from "./$types";
import PocketBase from "pocketbase";

export const load = (async ({params}) => {
    const { anime, episode } = params;
    const pb = new PocketBase("https://dev.opentrust.it/");

    let resultList = await pb.collection('mau_episodes').getFullList({
        filter: `(anime.slug="${anime}")`,
        expand: "anime",
    });

    // if there are two episodes with the same number
    // remove the one with the lower id
    for (let i = 0; i < resultList.length; i++) {
        for (let j = i + 1; j < resultList.length; j++) {
            if (resultList[i].number === resultList[j].number) {
                if (resultList[i].mau_id < resultList[j].mau_id) {
                    resultList.splice(i, 1);
                } else {
                    resultList.splice(j, 1);
                }
            }
        }
    }
  
    return { "episodes": resultList as unknown as Episode[] };
  }) satisfies PageLoad;
  