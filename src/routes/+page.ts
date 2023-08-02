import type { PageLoad } from "./$types";
import PocketBase from "pocketbase";

export const load = (async () => {
    const pb = new PocketBase("https://dev.opentrust.it/");
    const resultList = await pb.collection('mau_episodes').getList(1, 30, {
        sort: '-upload',
        expand: "anime",
    });
  
    return { "episodes": resultList };
  }) satisfies PageLoad;
  