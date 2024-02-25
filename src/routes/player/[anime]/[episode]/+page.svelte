<script lang="ts">
    import { base } from "$app/paths";
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { decodeHTMLEntities, fallbackImage, getSeasonIndex } from "$lib";
    import PocketBase from "pocketbase";
    import type { PageData } from "./$types";
    export let data: PageData;

    import hearth from "$lib/assets/icons/hearth.svg";
    import play from "$lib/assets/icons/play.svg";
    import pause from "$lib/assets/icons/pause.svg";
    import stop from "$lib/assets/icons/stop.svg";
    import { getUserSettings } from "$lib/db_helper";

    const pb = new PocketBase("https://dev.opentrust.it/");

    const year = new Date().getFullYear();
    const seasonIndex = getSeasonIndex();
    const WATCH_TRESHOLD = 0.2;
    const { anime, episode } = $page.params;
    const formatter = new Intl.NumberFormat("en", {
        notation: "compact",
    });

    // @ts-ignore
    declare var cast: any;
    // @ts-ignore
    declare var chrome: any;
    let player: any = null;
    let playerController: any = null;
    let castSession: any = null;
    let castDuration = 0;
    let castTimePlayer = 0;

    let watched = false;
    let time = 0;
    let duration: number;
    let paused = true;
    let volume = 1;
    let showDub = true;

    // rough estimate of how many seconds the user has watched
    let secondsWatched = 0;
    let watchTimer: number;

    let fallbackVideo = "";
    let useMirror = true;

    let isFavorite = false;
    let isCastConnected = false;
    let isCastPlaying = false;
    let videoSegments = [] as number[];
    let castTime = 0;
    let castWatchTimer: number;

    let animeRelated = [] as any[];

    $: timeSegments =
        videoSegments.length > 0
            ? videoSegments.map((segment) => {
                  return segment > 3600000
                      ? {
                            time: new Date(segment).toISOString().substr(11, 8),
                        }
                      : {
                            time: new Date(segment).toISOString().substr(14, 5),
                        };
              })
            : [];
    
    $: shownAnimeRelated = showDub ? animeRelated : animeRelated.filter((a) => !a.dub);

    async function getVideoUrl(id: number) {
        // const result = await fetch(`https://get-video-link.deno.dev/?v=${id}`);
        const result = await fetch(
            `https://mau-backend.deno.dev/api/mirror/${id}`,
        );
        const data = await result.json();
        fallbackVideo = data;
    }

    async function onCastPlayPause() {
        playerController.playOrPause();
        isCastPlaying = !player.isPaused;
    }

    function onCastStop() {
        playerController.stop();
        castSession.endSession();
    }

    function divideCastTime(index: number, total: number) {
        // 0 -> 0:00
        // index -> index / total * duration
        // total -> total converted to hh:mm:ss if > 1h or mm:ss if < 1h
        const percentage = index / total;
        const time = percentage * castDuration;
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time - hours * 3600) / 60);
        const seconds = Math.floor(time - hours * 3600 - minutes * 60);
        return `${hours > 0 ? hours + ":" : ""}${minutes}:${seconds}`;
    }

    function changeCastTime(event: any) {
        const timePercentage = event.target.value;
        const newTime = (timePercentage / 100) * castDuration;
        player.currentTime = newTime;
        playerController.seek();
        secondsWatched = newTime;
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

        castWatchTimer = setInterval(() => {
            if (!isCastPlaying || secondsWatched >= castDuration) {
                return;
            }

            secondsWatched++;
            // convert to percentage
            const percentage = secondsWatched / castDuration;
            castTimePlayer = percentage * 100;

            if (secondsWatched > castDuration) {
                secondsWatched = castDuration;
            }
        }, 1000);

        // get volume
        getUserSettings(pb).then((settings) => {
            if (settings) {
                volume = settings.volume;
                showDub = settings.dub;
            }
        });

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

        // load google cast sdk
        const script = document.createElement("script");
        script.src =
            "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
        script.async = true;
        document.body.appendChild(script);

        // @ts-ignore
        window["__onGCastApiAvailable"] = function (isAvailable: any) {
            if (isAvailable) {
                initializeCastApi();
            }
        };

        // pb.collection("mau_history").create({
        //             episode: ep?.id,
        //             user: pb.authStore.model?.id,
        //         });

        // get related anime
        let filter = `seasons.mal_id ?= '${ep?.expand.anime.mal_id}'`;
        if (!showDub) {
            filter += ` && seasons.dub = 0`;
        }
        pb.collection("mau_related")
            .getFullList({
                filter: filter,
                expand: "seasons",
            })
            .then((result) => {
                animeRelated = result[0].expand.seasons as any[];
            });
    });

    async function playVideoChromecast() {
        castSession =
            await cast.framework.CastContext.getInstance().getCurrentSession();

        const currentMediaURL = fallbackVideo;
        const contentType = "video/mp4";

        var mediaInfo = new chrome.cast.media.MediaInfo(
            currentMediaURL,
            contentType,
        );
        var request = new chrome.cast.media.LoadRequest(mediaInfo);

        if (!castSession) {
            // wait 2s and retry
            setTimeout(() => {
                playVideoChromecast();
            }, 2000);
            return;
        }
        castSession.loadMedia(request).then(
            function () {
                console.log("Load succeed");
                isCastPlaying = !player.isPaused;
                castDuration = player.duration;
                castTime = player.currentTime;
                const segmentsVideo = [];
                const segmentsNumber = 4;
                for (let i = 0; i < segmentsNumber; i++) {
                    segmentsVideo.push(
                        castDuration * (i / (segmentsNumber - 1)) * 1000,
                    );
                }
                videoSegments = segmentsVideo;
            },
            function (errorCode: any) {
                console.log("Error code: " + errorCode);
                onCastStop();
            },
        );

        player = new cast.framework.RemotePlayer();
        playerController = new cast.framework.RemotePlayerController(player);
    }

    function initializeCastApi() {
        const castContext = cast.framework.CastContext.getInstance();

        castContext.setOptions({
            receiverApplicationId:
                chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });

        cast.framework.CastContext.getInstance().addEventListener(
            cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            (event: any) => {
                switch (event.sessionState) {
                    case cast.framework.SessionState.SESSION_STARTED:
                        console.log("CastSession started");
                        isCastConnected = true;
                        playVideoChromecast();
                        break;
                    case cast.framework.SessionState.SESSION_RESUMED:
                        console.log("CastSession resumed");
                        isCastConnected = true;
                        playVideoChromecast();
                        break;
                    case cast.framework.SessionState.SESSION_ENDED:
                        console.log("CastSession disconnected");
                        isCastConnected = false;
                        break;
                }
            },
        );
    }

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
                // insert watched video in db
                pb.collection("mau_history").create({
                    episode: ep?.id,
                    user: pb.authStore.model?.id,
                });
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
        >Mau - {ep?.expand.anime.title_eng
            ? decodeHTMLEntities(ep?.expand.anime.title_eng)
            : decodeHTMLEntities(ep?.expand.anime.title)} - episode {episode}</title
    >
</svelte:head>

<google-cast-launcher
    id="castbutton"
    class="fixed bottom-4 right-4 z-50 w-14 h-14 m-4 p-3 bg-neutral-300 rounded-full cursor-pointer"
></google-cast-launcher>

{#if isCastConnected}
    <div class="w-full flex justify-center">
        <div
            class="rounded-xl bg-base-100 flex-1 max-w-3xl p-4 align-middle justify-center flex flex-col gap-2 shadow-lg mb-4"
        >
            <div class="flex flex-col gap-4">
                <div class="text-2xl font-bold">Chromecast</div>
                <div class="flex justify-center gap-4">
                    {#if isCastPlaying}
                        <button
                            class="btn btn-primary"
                            on:click={onCastPlayPause}
                        >
                            Pause
                            <svg class="w-6 h-6">
                                <use href="{pause}#pause" />
                            </svg>
                        </button>
                    {:else}
                        <button
                            class="btn btn-primary"
                            on:click={onCastPlayPause}
                        >
                            Play
                            <svg class="w-6 h-6">
                                <use href="{play}#play" />
                            </svg>
                        </button>
                    {/if}
                    <button class="btn btn-warning" on:click={onCastStop}>
                        Stop
                        <svg class="w-6 h-6">
                            <use href="{stop}#stop" />
                        </svg>
                    </button>
                </div>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                class="range range-primary mt-4"
                on:change={changeCastTime}
                bind:value={castTimePlayer}
            />
            <div class="w-full flex justify-between text-xs px-2">
                {#each timeSegments as segment}
                    <span>{segment.time}</span>
                {/each}
            </div>
        </div>
    </div>
{:else}
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
        id="main-video-player"
        class="mx-auto h-auto max-h-[70vh]
        border-transparent focus:outline-none rounded-xl"
    >
        <track kind="captions" />
    </video>
{/if}

<div class="flex flex-col justify-between items-center align-middle gap-5 mt-6">
    <div class="join flex flex-wrap gap-y-2">
        {#if ep?.expand.anime.episodes_count}
            {#each Array(ep?.expand.anime.episodes_count) as _, i}
                {#if sortedEpisodes.find((e) => e.number == i + 1)}
                    <a
                        class="join-item btn w-12 {i + 1 === ep.number
                            ? 'btn-primary'
                            : ''}"
                        href={`${base}/player/${anime}/${i + 1}`}
                        target="_self"
                    >
                        {i + 1}
                    </a>
                {:else}
                    <button class="join-item w-12 btn btn-disabled">
                        {i + 1}
                    </button>
                {/if}
            {/each}
        {:else}
            {#each sortedEpisodes as episode, i}
                <a
                    class="join-item btn w-12 {episode.number === ep?.number
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

<div class="flex justify-center items-center lg:items-start flex-col gap-2 lg:flex-row my-6">
    <div
        class="indicator w-3/4 md:w-fit rounded-xl {isFavorite
            ? 'gradient-border'
            : ''}"
    >
        <img
            class="w-full md:max-w-xs h-full object-contain rounded-xl"
            src={fallbackImage(ep?.expand.anime.imageurl ?? '')}
            alt={decodeHTMLEntities(ep?.expand.anime.title_eng)}
        />
        {#if pb.authStore.isValid}
            <span class="indicator-item indicator-end">
                <button
                    class="btn btn-circle"
                    on:click={() => followAnime(ep?.expand.anime)}
                >
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
        <span class="indicator-item indicator-center badge badge-neutral">
            {ep?.expand.anime.day}
        </span>
        <span class="indicator-item indicator-bottom indicator-center badge badge-accent">
            {ep?.expand.anime.season}
            {ep?.expand.anime.date}
        </span>
    </div>

    <div class="flex-1 p-4 rounded-xl bg-base-100 max-w-full xl:max-w-[70%]">
        <h2 class="text-2xl font-bold">
            {ep?.expand.anime.title_eng
                ? decodeHTMLEntities(ep.expand.anime.title_eng)
                : decodeHTMLEntities(ep?.expand.anime.title)}
        </h2>
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

        {#if shownAnimeRelated.length > 0}
            <div class="flex gap-2 flex-col mt-8 rounded-lg p-4 w-fit max-w-full">
                <div class="text-2xl font-bold">Related</div>
                <div class="carousel p-4 space-x-4 rounded-box">
                    {#each shownAnimeRelated as anime, index}
                        <a
                            class="carousel-item flex flex-col items-center indicator"
                            id="carousel-suggested-{index}"
                            data-sveltekit-reload
                            href="{base}/player/{anime.slug}/1"
                        >
                            <img
                                src={anime.imageurl}
                                alt={anime.title}
                                class="max-w-xs max-h-80 rounded-xl w-full h-full object-cover"
                            />
                            <div class="indicator-item indicator-bottom indicator-center badge badge-accent">
                                {anime.date}
                            </div>
                            {#if anime.dub}
                                <div class="indicator-item indicator-top indicator-center badge badge-secondary">
                                    DUB
                                </div>
                            {/if}
                </a>
                    {/each}
                </div>

                <div class="flex justify-center w-full py-2 gap-2">
                    {#each shownAnimeRelated as anime, index}
                        <a href="#carousel-suggested-{index}" class="btn btn-xs"
                            >{index + 1}</a
                        >
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .gradient-border {
        background:
            linear-gradient(transparent, transparent) padding-box,
            linear-gradient(
                    var(--angle),
                    theme("colors.primary"),
                    theme("colors.secondary")
                )
                border-box;
        animation: 8s rotate linear infinite;
        border: 3px solid #0000;
    }

    .gradient-border::after {
        content: "";
        filter: blur(0.5rem);
        position: absolute;
        inset: 0;
        z-index: -1;
        background:
            linear-gradient(transparent, transparent) padding-box,
            linear-gradient(
                    var(--angle),
                    theme("colors.primary"),
                    theme("colors.secondary")
                )
                border-box;
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
