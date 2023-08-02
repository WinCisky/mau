<script lang="ts">
    import type { PageData } from "./$types";
    export let data: PageData;

    $: episodes = data.episodes.items;
</script>

<svelte:head>
    <title>Mau</title>
</svelte:head>

<div class="flex flex-wrap justify-center gap-10 mb-10">
    {#each episodes as episode}
        <div class="indicator">
            <span class="indicator-item indicator-start badge badge-neutral">
                {episode.number} / {episode.expand.anime.episodes_count}
            </span>
            <span class="indicator-item indicator-bottom badge badge-info">
                {episode.expand.anime.score}
            </span> 
            <a class="card w-64 bg-base-100 shadow-xl" href={`player/${episode.expand.anime.slug}/${episode.number}`}>
                <!-- add episode number -->
                <figure>
                    <img
                        class="w-full h-72 object-contain"
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
                    <p>{episode.expand.anime.title}</p>
                    <!-- <div class="card-actions justify-end">
                    <div class="badge badge-outline">Fashion</div>
                    <div class="badge badge-outline">Products</div>
                </div> -->
                </div>
            </a>
        </div>
    {/each}
</div>
