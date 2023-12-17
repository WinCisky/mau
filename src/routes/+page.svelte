<script lang="ts">
    import { base } from "$app/paths";
    import PocketBase, { ListResult } from "pocketbase";
    import { onMount } from "svelte";
    import { decodeHTMLEntities, getCurrentSeason, getSeasonIndex } from "$lib";
    import { getLatestEpisodes } from "$lib/db_helper";
    import { getUserWatchedVideos } from "$lib/settings_helper";
    import type { Episode } from "$lib/db_helper";

    const pb = new PocketBase("https://dev.opentrust.it/");
    const year = new Date().getFullYear();
    const seasonIndex = getSeasonIndex();
    let episodes = [] as Episode[];
    let followedAnime = [] as any[];
    let page = 1;
    let watchedEspisodes = [] as string[];

    $: watched = watchedEspisodes;

    onMount(async () => {
        getLatestEpisodes(pb).then(async (resultList) => {
            episodes = resultList.items.map((item) => {
                return item as unknown as Episode;
            });

            if (pb.authStore.isValid) {
                watchedEspisodes = await getUserWatchedVideos(pb, episodes.map((e) => e.id));
            }
        });

        const followedAnimeResult = await pb
            .collection("mau_follows")
            .getFullList({
                filter: `year = ${year} && season = ${seasonIndex} && user_id = '${pb.authStore.model?.id}'`,
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
</svelte:head>

<!-- needed for static compilation -->
<a href="{base}/player/ignore/me" class="hidden">&nbsp;</a>

<div class="flex flex-wrap justify-center gap-8 md:gap-10 mb-10 mt-0 md:mt-4">
    {#if episodes && episodes.length > 0}
        {#each episodes as episode}
            <div class="indicator h-52 md:h-80">
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
                {#if episode.expand.anime.type === "ONA"}
                <span
                    class="indicator-item indicator-top indicator-center badge badge-secondary">
                    ONA
                </span>
                {/if}
                {#if episode.expand.anime.dub}
                <span
                    class="indicator-item indicator-bottom indicator-center badge badge-accent">
                    DUB
                </span>
                {/if}
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
                        {watched && watched.includes(episode.id)
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

    .gradient-border::after{
        content: '';
        filter: blur(.5rem);
        position: absolute;
        inset: 0;
        z-index: -1;
        background: linear-gradient(transparent, transparent) padding-box,
            linear-gradient(var(--angle), theme('colors.primary'), theme('colors.secondary')) border-box;
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
