<script lang="ts">
    import { base } from "$app/paths";
    import PocketBase, { ListResult } from "pocketbase";
    import { onMount } from "svelte";
    import { decodeHTMLEntities, getCurrentSeason, getSeasonIndex } from "$lib";
    import { getLatestEpisodes } from "$lib/db_helper";
    import { getUserWatchedVideos } from "$lib/settings_helper";
    import type { Episode } from "$lib/db_helper";

    import summer from "$lib/assets/icons/summer.svg";
    import winter from "$lib/assets/icons/winter.svg";
    import fall from "$lib/assets/icons/fall.svg";
    import spring from "$lib/assets/icons/spring.svg";
    import tea from "$lib/assets/icons/tea.svg";
    import home from "$lib/assets/icons/home.svg";

    const currentSeason = getCurrentSeason(winter, spring, summer, fall);

    const pb = new PocketBase("https://dev.opentrust.it/");
    const year = new Date().getFullYear();
    const seasonIndex = getSeasonIndex();
    let episodes = [] as Episode[];
    let followedAnime = [] as any[];
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

        const followedAnimeResult = await pb
            .collection("mau_follows")
            .getFullList({
                filter: `year = ${year} && season = ${seasonIndex} && user_id = '${pb.authStore.model?.id}'`,
            });
        followedAnime = followedAnimeResult;

        // if (typeof localStorage !== "undefined")
        //     watchedEspisodes = JSON.parse(
        //         localStorage.getItem("watchedVideos") || "{}"
        //     );
        if (pb.authStore.isValid) {
            // console.time('getUserWatchedVideos');
            watchedEspisodes = await getUserWatchedVideos(pb);
            // console.timeEnd('getUserWatchedVideos');
        } else if (
            // refresh token
            typeof pb.authStore.token !== "undefined" &&
            pb.authStore.token !== null &&
            pb.authStore.token !== ""
        ) {
            pb.collection("users").authWithOAuth2({ provider: "github" });
            // pb.collection("users").authRefresh();
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
    <ul
        class="menu bg-base-200 menu-horizontal rounded-box tabs tabs-boxed gap-5 items-center"
    >
        <li class="tab h-auto p-0">
            <a href="{base}/seasonal">
                <svg class="w-5 h-5">
                    <use href="{currentSeason}#season-img" />
                </svg>
                <div class="hidden sm:block">Seasonal</div>
            </a>
        </li>
        <li class="tab tab-active h-auto p-0">
            <a href="{base}/">
                <svg class="w-5 h-5">
                    <use href="{home}#home-img" />
                </svg>
                <div class="hidden sm:block">
                    Latest
                    <!-- <span class="badge badge-sm">99+</span> -->
                </div>
            </a>
        </li>
        <li class="tab h-auto p-0">
            <a href="{base}/followed">
                <svg class="w-5 h-5">
                    <use href="{tea}#tea-img" />
                </svg>
                <div class="hidden sm:block">Followed</div>
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
                    class="rounded-xl w-36 md:w-52 bg-base-100 shadow-xl
                        {watched &&
                    watched[episode.anime_id]?.includes(episode.number)
                        ? 'opacity-60'
                        : ''}
                        {followedAnime.some(
                        (a) => a.mal_id === episode.expand.anime.mal_id
                    )
                        ? 'border-2 gradient-border'
                        : ''}"
                    href={`${base}/player/${episode.expand.anime.slug}/${episode.number}`}
                >
                    <!-- add episode number -->
                    <img
                        class="rounded-xl w-full h-full object-cover"
                        src={episode.expand.anime.imageurl}
                        alt={episode.expand.anime.title}
                    />
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

<style>
    .gradient-border {
        background: linear-gradient(transparent, transparent) padding-box,
            linear-gradient(var(--angle), theme('colors.primary'), theme('colors.secondary')) border-box;
        animation: 8s rotate linear infinite;
        border: 3px solid #0000;
    }

    @keyframes rotate {
        to {
            --angle: 360deg;
        }
    }

    @property --angle {
        syntax: "<angle>";
        initial-value: 0deg;
        inherits: false;
    }
</style>
