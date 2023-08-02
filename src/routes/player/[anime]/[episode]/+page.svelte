<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import type { PageData } from "./$types";
    export let data: PageData;

    const WATCH_TRESHOLD = 0.75;
    const { anime, episode } = $page.params;

    let watched = false;
    let time = 0;
    let duration: number;
    let paused = true;

    // rough estimate of how many seconds the user has watched
    let secondsWatched = 0;
    let watchTimer = 0;

    $: ep = data.episodes.find((e) => e.number == episode);

    $: video = ep ? ep.link : "";
    // $: video = "";

    onMount(() => {
        watchTimer = setInterval(() => {
            if (!paused) {
                secondsWatched++;
            }

            if (watched) {
                clearInterval(watchTimer);
            }
        }, 1000);
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
            if (percentageWatched > WATCH_TRESHOLD) {
                watched = true;
                console.log("User has watched more than 75% of the video");
            }
        }
    }
</script>


<svelte:head>
    <title>Mau - {ep.expand.anime.title} - episode {episode}</title>
</svelte:head>

<video
    controls
    src={video}
    bind:currentTime={time}
    bind:duration
    bind:paused
    class="mx-auto h-[80vh]"
>
    <track kind="captions" />
</video>

<h2 class="text-2xl font-bold mt-4">{ep ? ep.expand.anime.title : ""}</h2>
{#if ep}
    <div class="join mt-4">
        {#each Array(ep.expand.anime.episodes_count) as _, i}
            <a
                class="join-item btn
            {i == episode ? 'btn-primary' : ''}
            {data.episodes.find((e) => e.number == i) ? '' : 'btn-disabled'}"
                href={`/${anime}/${i}`}
            >
                {i}
            </a>
        {/each}
    </div>
{/if}
