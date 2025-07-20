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

    type Anime = Database["public"]["Tables"]["animes"]["Row"];

    let volume = 1;
    let ep = null as EpisodeWithAnime | null;
    let episodes = null as EpisodeWithAnime[] | null;
    let videoUrl = null as string | null;
    let relatedAnime = null as Anime[] | null;

    async function getEpisodesWithAnime(
        animeId: number,
    ): Promise<EpisodeWithAnime[] | null> {
        let { data, error } = await supabase
            .from("episodes")
            .select("*, animes!fk_anime_id(*)")
            .eq("anime_id", animeId)
            .order("episode_number", { ascending: true });
        if (error) {
            console.error("Error fetching episode:", error);
            return null;
        } else {
            return data;
        }
    }

    async function fetchVideoUrl(
        animeId: number,
        episodeNumber: number,
    ): Promise<string | null> {
        try {
            const response = await fetch(
                `${backendEndpoint}/url/${animeId}/${episodeNumber}`,
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching video URL:", error);
            return null;
        }
    }

    async function getRelatedAnime(animeId: number): Promise<Anime[] | null> {
        // First, get the related entries for this anime
        let { data: related, error: relatedError } = await supabase
            .from("related")
            .select("id")
            .eq("anime_id", animeId)
            .single();

        if (relatedError || !related) {
            console.error("Error fetching related entries:", relatedError);
            return null;
        }

        let { data, error } = await supabase
            .from("animes")
            .select("*, related!inner(id, anime_id)")
            .eq("related.id", related.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching related anime:", error);
            return null;
        } else {
            return data;
        }
    }

    function changeEpisode(episodeNumber: number) {
        if (ep && ep.anime_id) {
            window.location.href = `${base}/player/${ep.anime_id}/${episodeNumber}`;
        }
    }

    function changeAnime(animeId: number) {
        window.location.href = `${base}/player/${animeId}/1`;
    }

    onMount(async () => {
        episodes = await getEpisodesWithAnime(parseInt(anime));
        if (episodes && episodes.length > 0) {
            ep =
                episodes.find((e) => e.episode_number === parseInt(episode)) ||
                null;
        }
        videoUrl = await fetchVideoUrl(parseInt(anime), parseInt(episode));
        relatedAnime = await getRelatedAnime(parseInt(anime));
    });
</script>

<svelte:head>
    {#if ep}
        <title
            >Mau - {decodeHTMLEntities(ep?.animes?.name ?? "")} - episode {ep?.episode_number ??
                1}
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
    <div class="flex items-center justify-center aspect-video skeleton"></div>
{/if}

<!-- Title -->
{#if ep}
    <h1 class="text-2xl md:text-3xl font-bold text-center mt-4">
        {decodeHTMLEntities(ep?.animes?.name ?? "")}
    </h1>
{:else}
    <h1 class="text-2xl md:text-3xl font-bold text-center mt-4">Loading...</h1>
{/if}

<div class="join flex justify-center mt-4 mb-8">
    {#if episodes && episodes.length > 0}
        {#each episodes as episode, index}
            <input
                class="join-item btn btn-square {ep?.episode_number ===
                episode.episode_number
                    ? 'btn-active'
                    : ''}"
                type="radio"
                name="options"
                aria-label={episode.episode_number.toString()}
                checked={ep?.episode_number === episode.episode_number}
                on:change={() => changeEpisode(episode.episode_number)}
            />
        {/each}
    {:else}
        {#each Array.from({ length: 3 }) as _}
            <button class="join-item btn btn-disabled">...</button>
        {/each}
    {/if}
</div>

<!-- Related -->
{#if relatedAnime && relatedAnime.length > 1}
    {#if ep?.animes?.description}
        <div>
            <p class="font-medium text-base">
                {ep?.animes?.description ?? 'No description available.'}
            </p>
        </div>
    {/if}
    <div class="carousel w-full">
        {#each relatedAnime as anime, index}
            <button
                type="button"
                id={anime.id.toString()}
                class="carousel-item indicator h-52 md:h-80 my-8 mx-2 cursor-pointer {anime.id === ep?.animes?.id ? 'gradient-border' : ''}"
                aria-label={`Select anime ${anime.name}`}
                on:click={() => changeAnime(anime.id)}
                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { changeAnime(anime.id); } }}
                role="button"
                tabindex="0"
            >
                {#if anime.dubbed}
                    <span
                        class="indicator-item indicator-bottom indicator-center badge badge-secondary"
                        >DUB</span
                    >
                {/if}
                <div class="rounded-xl w-36 md:w-52 bg-base-100 shadow-xl">
                    <img
                        class="rounded-xl w-full h-full object-cover"
                        src={anime.image_url}
                        alt={anime.name}
                        loading="eager"
                    />
                </div>
            </button>
        {/each}
    </div>
    <div class="flex w-full justify-center gap-2 py-2 flex-wrap">
        {#each relatedAnime as anime, index}
            <a href={`#${anime.id}`} class="btn btn-xs">{index + 1}</a>
        {/each}
    </div>
{:else}
    <div class="flex justify-center mt-4 gap-4">
        <div
            class="carousel-item indicator h-52 md:h-80 my-8 mx-2 cursor-pointer gradient-border"
            aria-label={`Select anime ${ep?.animes?.name ?? ''}`}
            role="button"
            tabindex="0"
        >
            {#if ep?.animes?.dubbed}
                <span
                    class="indicator-item indicator-bottom indicator-center badge badge-secondary"
                    >DUB</span
                >
            {/if}
            <div class="rounded-xl w-36 md:w-52 bg-base-100 shadow-xl">
                <img
                    class="rounded-xl w-full h-full object-cover"
                    src={ep?.animes?.image_url}
                    alt={ep?.animes?.name}
                    loading="eager"
                />
            </div>
        </div>
        {#if ep?.animes?.description}
            <div>
                <p class="font-medium text-base mx-4 my-8">
                    {ep?.animes?.description ?? 'No description available.'}
                </p>
            </div>
        {/if}
    </div>
{/if}

<style>
    .gradient-border {
        background: linear-gradient(transparent, transparent) padding-box,
            linear-gradient(var(--angle), var(--color-primary), var(--color-secondary)) border-box;
        animation: 8s rotate linear infinite;
        border: 3px solid #0000;
        border-radius: 0.75rem;
    }

    .gradient-border::after{
        content: '';
        filter: blur(1rem);
        position: absolute;
        inset: 0;
        z-index: -1;
        background: linear-gradient(transparent, transparent) padding-box,
            linear-gradient(var(--angle), var(--color-primary), var(--color-secondary)) border-box;
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