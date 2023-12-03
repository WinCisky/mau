<script lang="ts">
    import { base } from "$app/paths";
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { decodeHTMLEntities, getSeasonIndex } from "$lib";
    import { saveUserData } from "$lib/settings_helper";
    import PocketBase from "pocketbase";
    import type { PageData } from "./$types";
    export let data: PageData;

    import hearth from "$lib/assets/icons/hearth.svg";

    const pb = new PocketBase("https://dev.opentrust.it/");

    const year = new Date().getFullYear();
    const seasonIndex = getSeasonIndex();
    const WATCH_TRESHOLD = 0.75;
    const { anime, episode } = $page.params;
    const formatter = new Intl.NumberFormat("en", {
        notation: "compact",
    });

    let watched = false;
    let time = 0;
    let duration: number;
    let paused = true;
    let volume = 1;

    // rough estimate of how many seconds the user has watched
    let secondsWatched = 0;
    let watchTimer: number;

    let fallbackVideo = "";
    let useMirror = false;

    let isFavorite = false;

    async function getVideoUrl(id: number) {
        // const result = await fetch(`https://get-video-link.deno.dev/?v=${id}`);
        const result = await fetch(
            `https://mau-backend.deno.dev/api/mirror/${id}`
        );
        const data = await result.json();
        fallbackVideo = data;
    }

    $: ep = data.episodes.find((e) => e.number == parseInt(episode));
    $: sortedEpisodes = data.episodes.sort((a, b) => a.number - b.number);

    $: video =
        ep && (ep.link.includes("forbiddenlol") || useMirror)
            ? fallbackVideo
            : ep
            ? ep.link
            : "";
    // $: video = "";
    $: videoId = ep ? ep.mau_id : -1;

    onMount(() => {
        watchTimer = setInterval(() => {
            if (!paused) {
                secondsWatched++;
            }

            if (watched) {
                clearInterval(watchTimer);
            }
        }, 1000);

        if (typeof localStorage !== "undefined") {
            volume = parseFloat(localStorage.getItem("volume") || "1");
            const user_settings = localStorage.getItem("user_settings");
            if (user_settings != null) {
                const user_settings_json = JSON.parse(user_settings);
                if ("mirror" in user_settings_json) {
                    useMirror = user_settings_json.mirror;
                }
                saveUserData(pb);
            }
        }

        if (ep?.link.includes("forbiddenlol") || useMirror) {
            getVideoUrl(videoId);
        }

        // get if anime is followed
        pb.collection("mau_follows")
            .getList(1, 1, {
                filter: `mal_id = '${ep?.expand.anime.mal_id}' && user_id = '${pb.authStore.model?.id}'`,
            })
            .then((result) => {
                if (result.items.length > 0) {
                    isFavorite = true;
                }
            });

        // console.log(ep?.expand.anime.mal_id);
    });

    onDestroy(() => {
        clearInterval(watchTimer);
    });

    $: {
        if (
            !watched &&
            duration &&
            typeof duration === "number" &&
            duration > 0
        ) {
            const percentageWatched = secondsWatched / duration;
            if (
                percentageWatched > WATCH_TRESHOLD &&
                typeof localStorage !== "undefined"
            ) {
                watched = true;
                // add to localstorage videos watched
                let watchedVideos = localStorage.getItem("watchedVideos");
                let videos = {} as Record<string, number[]>;
                if (watchedVideos) {
                    videos = JSON.parse(watchedVideos) as Record<
                        string,
                        number[]
                    >;
                }
                if (!videos[ep?.anime_id ?? 0]?.includes(ep?.number ?? 0)) {
                    videos[ep?.anime_id ?? 0] = [
                        ...((videos[ep?.anime_id ?? 0] || []) as number[]),
                        ep?.number ?? 0,
                    ];
                    localStorage.setItem(
                        "watchedVideos",
                        JSON.stringify(videos)
                    );
                }
            }
        }
    }

    function followAnime(anime: any) {
        if (isFavorite) {
            isFavorite = false;
            // get from db
            pb.collection("mau_follows")
                .getList(1, 1, {
                    filter: `mal_id = '${anime.mal_id}' && user_id = '${pb.authStore.model?.id}'`,
                })
                .then((result) => {
                    if (result.items.length > 0) {
                        pb.collection("mau_follows").delete(result.items[0].id);
                    }
                });
            return;
        } else {
            isFavorite = true;
            // save to db
            const toCreate = {
                mal_id: anime.mal_id,
                user_id: pb.authStore.model?.id,
                year: year,
                season: seasonIndex,
            };
            pb.collection("mau_follows").create(toCreate);
        }

    }
</script>

<svelte:head>
    <title
        >Mau - {ep?.expand.anime.title
            ? decodeHTMLEntities(ep?.expand.anime.title)
            : decodeHTMLEntities(ep?.expand.anime.title_eng)} - episode {episode}</title
    >
</svelte:head>

<video
    controls
    src={video}
    bind:currentTime={time}
    bind:duration
    bind:paused
    bind:volume
    on:volumechange={() => {
        if (typeof localStorage !== "undefined")
            localStorage.setItem("volume", volume.toString());
    }}
    class="mx-auto h-auto max-h-[70vh]
        border-transparent focus:outline-none"
>
    <track kind="captions" />
</video>

<div
    class="flex flex-col lg:flex-row justify-between items-center align-middle gap-5 mt-6"
>
    <h2 class="text-2xl font-bold">
        {ep?.expand.anime.title
            ? decodeHTMLEntities(ep.expand.anime.title)
            : decodeHTMLEntities(ep?.expand.anime.title_eng)}
    </h2>

    <div class="join flex flex-wrap">
        {#if ep?.expand.anime.episodes_count}
            {#each Array(ep?.expand.anime.episodes_count) as _, i}
                {#if sortedEpisodes.find((e) => e.number == i + 1)}
                    <a
                        class="join-item btn {i + 1 === ep.number
                            ? 'btn-primary'
                            : ''}"
                        href={`${base}/player/${anime}/${i + 1}`}
                        target="_self"
                    >
                        {i + 1}
                    </a>
                {:else}
                    <button class="join-item btn btn-disabled">
                        {i + 1}
                    </button>
                {/if}
            {/each}
        {:else}
            {#each sortedEpisodes as episode, i}
                <a
                    class="join-item btn {episode.number === ep?.number
                        ? 'btn-primary'
                        : ''}"
                    href={`${base}/player/${anime}/${i + 1}`}
                    target="_self"
                >
                    {episode.number}
                </a>
            {/each}
        {/if}
    </div>
</div>

<div class="flex justify-center items-center flex-col lg:flex-row gap-24 mb-6">
    <div class="indicator w-3/4 md:w-fit mt-6">
        <img
            class="w-full md:max-w-xs h-full object-contain rounded-xl {isFavorite
                ? 'gradient-border'
                : ''}"
            src={ep?.expand.anime.imageurl}
            alt={decodeHTMLEntities(ep?.expand.anime.title_eng)}
        />
        {#if pb.authStore.isValid }
        <span class="indicator-item indicator-end">
            <button class="btn btn-circle" on:click={() => followAnime(ep?.expand.anime)}>
                <svg
                    class="w-6 h-6 {isFavorite
                        ? 'fill-red-600'
                        : 'stroke-base-content fill-none'}"
                >
                    <use href="{hearth}#hearth" />
                </svg>
            </button>
        </span>
        {/if}
        <span class="indicator-item indicator-start badge badge-neutral">
            {ep?.expand.anime.day}
        </span>
        <span class="indicator-item indicator-bottom badge badge-accent">
            {ep?.expand.anime.season}
            {ep?.expand.anime.date}
        </span>
    </div>

    <div class="flex-1">
        <p class="mt-4">
            Studio:
            <span class="font-bold mt-4">
                {decodeHTMLEntities(ep?.expand.anime.studio)}
            </span>
        </p>
        <div
            class="stats stats-vertical md:stats-horizontal shadow mt-6 flex-col"
        >
            <div class="stat">
                <div class="stat-figure text-primary">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        class="inline-block w-8 h-8 stroke-current"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                        /></svg
                    >
                </div>
                <div class="stat-title">Visualizzazioni Episodio</div>
                <div class="stat-value text-primary">
                    {formatter.format(ep?.visite ?? 0)}
                </div>
                <!-- <div class="stat-desc">21% more than last month</div> -->
            </div>

            <div class="stat">
                <div class="stat-figure text-secondary">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        class="inline-block w-8 h-8 stroke-current"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"
                        /></svg
                    >
                </div>
                <div class="stat-title">Visualizzazioni Anime</div>
                <div class="stat-value text-secondary">
                    {formatter.format(ep?.expand.anime.visite ?? 0)}
                </div>
                <!-- <div class="stat-desc">21% more than last month</div> -->
            </div>

            {#if ep?.expand.anime.score}
                <div class="stat">
                    <div class="stat-figure">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="inline-block w-8 h-8 stroke-current"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
                            /></svg
                        >
                    </div>
                    <div class="stat-title">Punteggio</div>
                    <div class="stat-value">{ep?.expand.anime.score}</div>
                    <!-- <div class="stat-desc text-secondary">31 tasks remaining</div> -->
                </div>
            {/if}
        </div>

        <p class="mt-8">
            {decodeHTMLEntities(ep?.expand.anime.plot)}
        </p>
    </div>
</div>

<style>
    .gradient-border {
        background: linear-gradient(transparent, transparent) padding-box,
            linear-gradient(
                    var(--angle),
                    theme("colors.primary"),
                    theme("colors.secondary")
                )
                border-box;
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
