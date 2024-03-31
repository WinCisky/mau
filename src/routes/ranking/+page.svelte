<script lang="ts">
    import { onMount } from "svelte";
    import { getAnimeEpisodesCount, getTopAllTimeAnime, getTopPopularAnime, getTopSeasonalAnime } from "$lib/db_helper";
    import PocketBase, { ListResult } from "pocketbase";
    import { base } from "$app/paths";
    import { fallbackImage } from "$lib";

    const pb = new PocketBase("https://dev.opentrust.it/");

    let activeTab = "Seasonal"; // Default active tab
    let data: ListResult<Record<string, any>> | null = null;
    let page = 1;
    let isLoading = true;

    async function loadCategory() {
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
            if (data) {
                data.items = [...data.items, ...newData.items];
            } else {
                data = newData;
            }
        }
        isLoading = false;
    }

    async function loadMore() {
        page++;
        await loadCategory();
        loadBackgroundImages();
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
            if (element && anime.video && anime.video != '-') {
                await setBackgroundImage(element, anime.video);
            } else if (element && anime.cover && !anime.cover.includes("forbiddenlol")) {
                element.style.backgroundImage = `linear-gradient(var(--fallback-b2, oklch(var(--b2) / 0.7)),var(--fallback-b2, oklch(var(--b2) / 0.6))), url(${anime.cover})`;
            } else if (element && anime.imageurl) {
                element.style.backgroundImage = `linear-gradient(var(--fallback-b2, oklch(var(--b2) / 0.7)),var(--fallback-b2, oklch(var(--b2) / 0.6))), url(${anime.imageurl})`;
            }
        }
    }
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

    <div class="overflow-x-auto bg-base-100 rounded-lg max-w-screen-lg">
        <table class="table">
            <tbody>
                {#if data && data.items.length > 0}
                    {#each data.items as anime}
                        <tr id="bck-{anime.id}" class="bg-center bg-no-repeat bg-cover border-none">
                            <td>
                                <div class="flex items-center gap-3 max-w-xs">
                                    <a 
                                        href="{base}/player/{anime.slug}/1"
                                        class="avatar"
                                    >
                                        <div
                                            class="mask mask-squircle w-28 h-28"
                                        >
                                            <img
                                                src="{fallbackImage(anime.imageurl ?? '')}"
                                                alt="{anime.title_eng}"
                                            />
                                        </div>
                                    </a>
                                    <div>
                                        <div class="mb-1">
                                            {@html anime.studio}
                                        </div>
                                        <span class="badge badge-secondary badge-sm">
                                            {anime.type}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="font-bold text-lg max-w-sm">
                                    {@html anime.title_eng}
                                </div>
                                <br />
                                {#if anime.dub == 1}
                                    <span class="badge badge-accent badge-sm"
                                        >DUB</span
                                    >
                                {/if}
                            </td>
                        </tr>
                    {/each}
                {:else if isLoading}
                    {#each [1, 2, 3, 4, 5] as _}
                        <tr>
                            <td class="text-center">
                                <div
                                    class="skeleton w-28 h-28 rounded-full"
                                ></div>
                            </td>
                            <td class="text-center">
                                <div class="skeleton h-4 w-12 md:w-44"></div>
                            </td>
                            <td class="text-center">
                                <div class="skeleton h-4 w-12 md:w-44"></div>
                            </td>
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td colspan="3" class="text-center">No data</td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>

    <div class="flex justify-center">
        <button class="btn btn-primary" on:click={loadMore}>
            Load more
        </button>
    </div>
</div>
