<script lang="ts">
    import { afterUpdate } from "svelte";
    import { base } from "$app/paths";
    import { fallbackImage, smallImage } from "$lib";
    import type { Database } from "$lib/database.types";

    type EpisodeWithAnime = Database["public"]["Tables"]["episodes"]["Row"] & {
        animes: Database["public"]["Tables"]["animes"]["Row"] | null;
    };
    export let episodes = [] as EpisodeWithAnime[];
    export let followedAnime = [] as any[];
    export let loadMore;
    export let withLoadingPlaceholder = true;
    
    let observer: IntersectionObserver | null = null;
    afterUpdate(() => {
        if (observer) observer.disconnect();
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadMore();
                }
            });
        });
        const loadMoreSkeleton = document.getElementById('load-more-skeleton');
        if (loadMoreSkeleton) {
            observer.observe(loadMoreSkeleton);
        }
    });

</script>


<div class="flex flex-wrap justify-center gap-8 md:gap-10 mb-10 mt-0 md:mt-4">
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
                <a
                    class="rounded-xl w-36 md:w-52 bg-base-100 shadow-xl"
                    href={`${base}/player/${episode.anime_id}/${episode.episode_number ?? 1}`}
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
            <div class="skeleton w-36 h-52 md:w-52 md:h-72" id="load-more-skeleton"></div>
        {/if}
    {/if}
    {#each Array.from({ length: 10 }) as _}
        <div class="skeleton w-36 h-52 md:w-52 md:h-72"></div>
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