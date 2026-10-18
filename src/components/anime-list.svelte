<script lang="ts">
    import { afterUpdate, onDestroy, tick } from "svelte";
    import { resolve } from "$app/paths";
    import type { Database } from "#lib/database.types.ts";


    import CalendarCheckIcon from "#lib/assets/icons/calendar-check.svg?raw";

    type EpisodeWithAnime = Database["public"]["Tables"]["episodes"]["Row"] & {
        animes: Database["public"]["Tables"]["animes"]["Row"] | null;
    };
    export let episodes = [] as EpisodeWithAnime[];
    export let loadMore: () => unknown | Promise<unknown>;
    export let withLoadingPlaceholder = true;

    const MARGIN = 300; // px of look-ahead before the sentinel enters the viewport
    let container: HTMLDivElement;
    let observer: IntersectionObserver | null = null;
    let loading = false;
    let destroyed = false;

    // The sentinel needs loading if it is visible OR already scrolled past
    // (e.g. scroll position restored on back navigation, landing on the
    // trailing skeletons below the sentinel).
    function sentinelNeedsLoad(): boolean {
        const sentinel = container?.querySelector('#load-more-skeleton');
        if (!sentinel) return false;
        return sentinel.getBoundingClientRect().top < window.innerHeight + MARGIN;
    }

    async function maybeLoadMore() {
        if (loading || destroyed || !withLoadingPlaceholder) return;
        if (!episodes || episodes.length === 0) return; // initial load handled by parent
        if (!sentinelNeedsLoad()) return;
        loading = true;
        const before = episodes.length;
        try {
            await loadMore();
        } finally {
            loading = false;
        }
        await tick();
        // Keep loading while the sentinel is still in/above the viewport,
        // but stop if nothing new arrived (end of data or error).
        if (episodes.length > before) maybeLoadMore();
    }

    afterUpdate(() => {
        if (observer) observer.disconnect();
        if (!container) return;
        observer = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) maybeLoadMore();
        }, { rootMargin: `0px 0px ${MARGIN}px 0px` });
        // Observe the sentinel and every trailing skeleton, so landing anywhere
        // in the skeleton area triggers a load.
        container.querySelectorAll('.load-more-trigger').forEach((el) => observer!.observe(el));
        maybeLoadMore();
    });

    onDestroy(() => {
        destroyed = true;
        observer?.disconnect();
    });

    function isToday(date: string): boolean {
        const today = new Date();
        const episodeDate = new Date(date);
        return (
            today.getDate() === episodeDate.getDate() &&
            today.getMonth() === episodeDate.getMonth() &&
            today.getFullYear() === episodeDate.getFullYear()
        );
    }

</script>


<div bind:this={container} class="flex flex-wrap justify-center gap-8 md:gap-10 mb-10 mt-0 md:mt-4">
    {#if episodes && episodes.length > 0}
        {#each episodes as episode, index}
            <div class="indicator h-52 md:h-80">
                {#if episode.episode_number}
                    <span
                        class="indicator-item indicator-start badge badge-neutral font-semibold items-baseline"
                    >
                        {episode.episode_number}
                    </span>
                {/if}
                {#if episode.animes?.dubbed}
                    <span
                        class="indicator-item indicator-bottom indicator-center badge badge-secondary"
                    >DUB</span>
                {/if}
                {#if episode.created_at && isToday(episode.created_at)}
                    <span
                        class="indicator-item indicator-center badge badge-primary p-[2px] h-auto"
                    >{@html CalendarCheckIcon}</span>
                {/if}
                <a
                    class="rounded-xl w-36 md:w-52 bg-base-100 shadow-xl"
                    href={resolve('/player/[anime]/[episode]', { anime: String(episode.anime_id), episode: String(episode.episode_number ?? 1) })}
                    aria-label={`Watch ${episode.animes?.name} episode ${episode.episode_number}`}
                >
                    <!-- add episode number -->
                    <img
                        class="rounded-xl w-full h-full object-cover"
                        src={episode.animes?.image_url}
                        alt={episode.animes?.name}
                        loading="{index > 1 ? 'lazy' : 'eager'}"
                    />
                </a>
            </div>
        {/each}
        
        {#if withLoadingPlaceholder}
            <div class="skeleton w-36 h-52 md:w-52 md:h-72 load-more-trigger" id="load-more-skeleton"></div>
        {/if}
    {/if}
    {#each Array.from({ length: 10 }) as _}
        <div class="skeleton w-36 h-52 md:w-52 md:h-72 load-more-trigger"></div>
    {/each}
    
</div>

<style>
    .gradient-border {
        background: linear-gradient(transparent, transparent) padding-box,
            linear-gradient(var(--angle), var(--color-primary), var(--color-secondary)) border-box;
        animation: 8s rotate linear infinite;
        border: 3px solid #0000;
    }

    .gradient-border::after{
        content: '';
        filter: blur(1.5rem);
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