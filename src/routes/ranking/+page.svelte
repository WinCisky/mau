<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import {
        getTopAllTimeAnime,
        getTopPopularAnime,
        getTopSeasonalAnime
    } from "$lib/db_helper";
    import PocketBase, { type ListResult } from "pocketbase";
    import { base } from "$app/paths";
    import { fallbackImage } from "$lib";

    const pb = new PocketBase("https://dev.opentrust.it/");

    let activeTab = "Seasonal"; // Default active tab
    let data: ListResult<Record<string, any>> | null = null;
    let page = 1;
    let isLoading = true;
    let hoveredElementId: number = -1;
    let observer: IntersectionObserver | null = null;

    async function loadCategory() {
        let hasMore = false;
        let newData: ListResult<Record<string, any>> | null = null;
        switch (activeTab) {
            case "All time":
                newData = await getTopAllTimeAnime(pb, page);
                break;
            case "Seasonal":
                newData = await getTopSeasonalAnime(pb, page);
                break;
            case "Popular":
                newData = await getTopPopularAnime(pb, page);
                break;
        }
        // merge
        if (newData) {
            hasMore = newData.items.length > 0;
            if (data) {
                data.items = [...data.items, ...newData.items];
            } else {
                data = newData;
            }
        }
        isLoading = false;
        return hasMore;
    }

    async function loadMore() {
        page++;
        const hasMore = await loadCategory();
        loadBackgroundImages();
        if (!hasMore) {
            observer?.disconnect();
            // hide skeleton
            const loadMoreSkeleton = document.querySelectorAll('.skeleton');
            for (const skeleton of loadMoreSkeleton) {
                (skeleton as HTMLElement).style.display = 'none';
            }
        }
    }

    async function setTab(tab: string) {
        isLoading = true;
        activeTab = tab;
        page = 1;
        data = null;
        await loadCategory();
        loadBackgroundImages();
    }

    onMount(async () => {
        await loadCategory();
        await loadBackgroundImages();
    });

    async function setBackgroundImage(element: HTMLElement, id: string) {
        const imgUrl = `http://img.youtube.com/vi/${id}/0.jpg`;
        // const imgUrl = `http://img.youtube.com/vi/${id}/maxresdefault.jpg`;
        // element.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), url(${imgUrl})`;
        element.style.backgroundImage = `linear-gradient(var(--fallback-b2, oklch(var(--b2) / 0.7)),var(--fallback-b2, oklch(var(--b2) / 0.6))), url(${imgUrl})`;
        element.onerror = () => {
            console.log("error");
        };
    }

    async function loadBackgroundImages() {
        if (!data) return;
        for (const anime of data?.items) {
            const element = document.getElementById(`bck-${anime.id}`);
            // console.log(element);
            if (element && anime.video && anime.video != "-") {
                await setBackgroundImage(element, anime.video);
            } else if (
                element &&
                anime.cover &&
                !anime.cover.includes("forbiddenlol")
            ) {
                element.style.backgroundImage = `linear-gradient(var(--fallback-b2, oklch(var(--b2) / 0.7)),var(--fallback-b2, oklch(var(--b2) / 0.6))), url(${anime.cover})`;
            } else if (element && anime.imageurl) {
                element.style.backgroundImage = `linear-gradient(var(--fallback-b2, oklch(var(--b2) / 0.7)),var(--fallback-b2, oklch(var(--b2) / 0.6))), url(${anime.imageurl})`;
            }
        }
    }

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

<div class="flex flex-col items-center gap-8">
    <div role="tablist" class="tabs tabs-boxed w-fit">
        <button
            role="tab"
            class="tab"
            on:click={() => setTab("All time")}
            class:tab-active={activeTab === "All time"}>All time</button
        >
        <button
            role="tab"
            class="tab"
            on:click={() => setTab("Seasonal")}
            class:tab-active={activeTab === "Seasonal"}>Seasonal</button
        >
        <button
            role="tab"
            class="tab"
            on:click={() => setTab("Popular")}
            class:tab-active={activeTab === "Popular"}>Popular</button
        >
    </div>

    <div class="overflow-x-auto rounded-lg flex flex-wrap gap-4 justify-center mb-10 gap-8">
        {#if data && data.items.length > 0}
            {#each data.items as anime}
            <a class="card w-36 h-80 md:w-72 md:h-96 bg-base-100 shadow-xl"
                href="{base}/player/{anime.slug}/{anime.number ?? 1}"
            >                
                <figure class="-mb-4">
                    <img
                        class="object-cover w-full"
                        src={fallbackImage(
                            anime.imageurl ?? "",
                        )}
                        alt={anime.title_eng}
                    />
                </figure>
                <div class="indicator card-body p-4 md:p-8 rounded-2xl bg-base-300 w-auto">
                    <h2 class="card-title hidden md:inline ">
                        {@html anime.studio}
                        <span
                            class="badge badge-secondary badge-sm"
                        >
                            {anime.type}
                        </span>
                    </h2>
                    <p>{@html anime.title_eng}</p>
                    <div class="hidden md:inline card-actions justify-end">
                        {#if anime.dub == 1}
                            <span class="badge badge-accent badge-sm"
                                >DUB</span
                            >
                        {/if}
                    </div>

                    <span class="inline md:hidden indicator-item indicator-top indicator-center badge badge-secondary">
                        {anime.type}
                    </span>

                    {#if anime.dub == 1}
                        <span class="inline md:hidden indicator-item indicator-bottom indicator-center badge badge-accent">
                            DUB
                        </span>
                    {/if}
                </div>
            </a>
            {/each}
        {/if}

        <div class="skeleton w-36 h-80 md:w-72 md:h-96" id='load-more-skeleton'></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
        <div class="skeleton w-36 h-80 md:w-72 md:h-96"></div>
    </div>
</div>
