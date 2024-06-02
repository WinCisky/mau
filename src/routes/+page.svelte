<script lang="ts">
    import { base } from "$app/paths";
    import PocketBase from "pocketbase";
    import { onMount } from "svelte";
    import { getSeasonIndex } from "$lib";
    import { getLatestEpisodes } from "$lib/db_helper";
    import type { Episode } from "$lib/db_helper";
    import AnimeList from "../components/anime-list.svelte";

    const pb = new PocketBase("https://dev.opentrust.it/");
    const year = new Date().getFullYear();
    const seasonIndex = getSeasonIndex();
    let episodes = [] as Episode[];
    let followedAnime = [] as any[];
    let page = 1;

    onMount(async () => {
        getLatestEpisodes(pb).then(async (resultList) => {
            episodes = resultList.items.map((item) => {
                return item as unknown as Episode;
            });
        });

        let filter = `(year = ${year} && season = ${seasonIndex})`;
        if (seasonIndex === 0) {
            filter = `((year = ${year} && season = ${seasonIndex}) || (year = ${year - 1} && season = 3))`;
        }
        filter += ` && user = '${pb.authStore.model?.id}'`;
        
        const followedAnimeResult = await pb
            .collection("mau_follows")
            .getFullList({
                filter: filter,
                expand: "anime"
            });
        followedAnime = followedAnimeResult;
    });

    function loadMore() {
        getLatestEpisodes(pb, ++page).then((resultList) => {
            episodes = episodes.concat(
                resultList.items.map((item) => {
                    return item as unknown as Episode;
                })
            );
        });
    }
</script>

<svelte:head>
    <title>Mau</title>
    <meta name="description" content="mau" />
</svelte:head>

<!-- needed for static compilation -->
<a href="{base}/player/ignore/me" class="hidden">&nbsp;</a>

<AnimeList {episodes} {followedAnime} {loadMore} />
