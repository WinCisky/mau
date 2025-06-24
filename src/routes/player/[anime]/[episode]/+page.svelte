<script lang="ts">
    import { base } from "$app/paths";
    import { decodeHTMLEntities } from "$lib";
    import type { PageData } from "./$types";
    import { page } from "$app/stores";
    import { type Database } from "$lib/database.types";
    import { supabase } from "$lib/db_helper";
    import { onMount } from "svelte";
    const { anime, episode } = $page.params;

    const backendEndpoint = "https://slim-boar-34.deno.dev";

    type EpisodeWithAnime = Database["public"]["Tables"]["episodes"]["Row"] & {
        animes: Database["public"]["Tables"]["animes"]["Row"] | null;
    };

    let volume = 1 as number;
    let ep = null as EpisodeWithAnime | null;
    let videoUrl = null as string | null;

    onMount(async () => {
        console.log("Mounting player page", anime, episode);
        videoUrl = await fetch(`${backendEndpoint}/url/${anime}/${episode}`)
            .then((res) => res.json())
            .catch((err) => {
                console.error("Error fetching video URL:", err);
                return null;
            });
    });

</script>

<svelte:head>
    {#if ep}
        <title
            >Mau - {decodeHTMLEntities(ep?.animes?.name ?? '')} - episode {ep?.episode_number ?? 1}
        </title>
    {:else}
        <title>Mau - Player</title>
    {/if}
</svelte:head>

{#if videoUrl}
<video
    controls
    src={videoUrl}
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
{:else}
    <div class="flex items-center justify-center h-[60svh] skeleton">
    </div>
{/if}