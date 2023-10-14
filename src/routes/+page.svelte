<script lang="ts">
    import { base } from "$app/paths";
    import PocketBase, { ListResult } from "pocketbase";
    import { onMount } from "svelte";
    import { decodeHTMLEntities, getCurrentSeason } from "$lib";
    import { getLatestEpisodes } from "$lib/db_helper";
    import { getUserWatchedVideos } from "$lib/settings_helper";
    import type { Episode } from "$lib/db_helper";

    import summer from '$lib/assets/icons/summer.svg'
    import winter from '$lib/assets/icons/winter.svg'
    import autumn from '$lib/assets/icons/autumn.svg'
    import spring from '$lib/assets/icons/spring.svg'
    import tea from '$lib/assets/icons/tea.svg'

    const currentSeason = getCurrentSeason(winter, spring, summer, autumn);

    const pb = new PocketBase("https://dev.opentrust.it/");
    let episodes = [] as Episode[];
    let page = 1;
    let watchedEspisodes = {} as Record<string, number[]>;

    $: watched = watchedEspisodes;

    onMount(async () => {
        getLatestEpisodes(pb).then((resultList) => {
            // console.log(JSON.stringify(resultList, null, 2));
            episodes = resultList.items.map((item) => {
                return item as unknown as Episode;
            });
        });

        // if (typeof localStorage !== "undefined")
        //     watchedEspisodes = JSON.parse(
        //         localStorage.getItem("watchedVideos") || "{}"
        //     );
        if (pb.authStore.isValid) {
            await pb.collection('users').authRefresh();
            // console.time('getUserWatchedVideos');
            watchedEspisodes = await getUserWatchedVideos(pb);
            // console.timeEnd('getUserWatchedVideos');
        }
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
</svelte:head>

<!-- needed for static compilation -->
<a href="{base}/player/ignore/me" class="hidden">&nbsp;</a>

<div class="flex justify-center align-middle mb-10">
    <ul class="menu bg-base-200 lg:menu-horizontal rounded-box tabs tabs-boxed gap-5">
        <li class="tab tab-active h-auto p-0">
          <a href="{base}/">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Latest
            <!-- <span class="badge badge-sm">99+</span> -->
          </a>
        </li>
        <li class="tab h-auto p-0">
          <a href="{base}/seasonal">
            <svg class="w-5 h-5">
                <use href="{currentSeason}#season-img"></use>
             </svg>
            Seasonal
          </a>
        </li>
        <li class="tab h-auto p-0">
          <a href="{base}/followed">
            <svg class="w-5 h-5">
                <use href="{tea}#tea-img"></use>
             </svg>
            Followed
          </a>
        </li>
      </ul>
</div>

<div class="flex flex-wrap justify-center gap-8 md:gap-10 mb-10">
    {#if episodes && episodes.length > 0}
        {#each episodes as episode}
            <div class="indicator">
                <span
                    class="indicator-item indicator-start badge badge-neutral"
                >
                    {episode.number}
                    {#if episode.expand.anime.episodes_count != 0}
                        <span class="hidden md:inline md:pl-1"
                            >/ {episode.expand.anime.episodes_count}</span
                        >
                    {/if}
                </span>
                {#if episode.expand.anime.score}
                    <span
                        class="indicator-item hidden md:inline indicator-bottom badge badge-info"
                    >
                        {episode.expand.anime.score}
                    </span>
                    <span
                        class="indicator-item md:hidden indicator-bottom badge badge-info"
                    >
                        {parseInt(episode.expand.anime.score)}
                    </span>
                {/if}
                <a
                    class="card w-36 md:w-52 bg-base-100 shadow-xl
                        {watched &&
                    watched[episode.anime_id]?.includes(episode.number)
                        ? 'opacity-60'
                        : ''}"
                    href={`${base}/player/${episode.expand.anime.slug}/${episode.number}`}
                >
                    <!-- add episode number -->
                    <figure>
                        <img
                            class="w-full h-48 md:h-72 object-cover"
                            src={episode.expand.anime.imageurl}
                            alt={episode.expand.anime.title}
                        />
                    </figure>
                    <div class="card-body">
                        <h2 class="card-title">
                            <!-- if it's of today show new -->
                            {#if episode.upload.slice(0, 10) == new Date()
                                    .toISOString()
                                    .slice(0, 10)}
                                <div class="badge badge-primary">NEW</div>
                            {/if}
                            <!-- DUB -->
                            {#if episode.expand.anime.dub}
                                <div class="badge badge-success">DUB</div>
                            {/if}
                            <!-- ONA -->
                            {#if episode.expand.anime.type == "ONA"}
                                <div class="badge badge-secondary">ONA</div>
                            {/if}
                        </h2>
                        <p
                            class="break-words truncate md:overflow-auto md:whitespace-normal overflow-auto"
                        >
                            {episode.expand.anime.title
                                ? decodeHTMLEntities(episode.expand.anime.title)
                                : decodeHTMLEntities(
                                      episode.expand.anime.title_eng
                                  )}
                        </p>
                    </div>
                </a>
            </div>
        {/each}
        <button class="btn btn-neutral btn-block w-fit" on:click={loadMore}>
            Load more
        </button>
    {:else}
        <span class="loading loading-spinner loading-lg" />
    {/if}
</div>
