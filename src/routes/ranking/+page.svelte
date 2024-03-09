<script lang="ts">
    import { onMount } from "svelte";
    import { getAnimeEpisodesCount, getTopSeasonalAnime } from "$lib/db_helper";
    import PocketBase, { ListResult } from "pocketbase";
    import { base } from "$app/paths";

    const pb = new PocketBase("https://dev.opentrust.it/");

    let activeTab = "Seasonal"; // Default active tab
    let data: ListResult<Record<string, any>> | null = null;
    let page = 1;
    let isLoading = true;

    async function loadCategory() {
        let newData: ListResult<Record<string, any>> | null = null;
        switch (activeTab) {
            case "All time":
                // getTopAllTimeAnime(pb, page);
                break;
            case "Seasonal":
                newData = await getTopSeasonalAnime(pb, page);
                break;
            case "Popular":
                // getTopPopularAnime(pb, page);
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
        console.log(data);
    }

    function loadMore() {
        page++;
        loadCategory();
    }

    function setTab(tab: string) {
        activeTab = tab;
        page = 1;
        loadCategory();
    }

    onMount(async () => {
        loadCategory();
    });
</script>

<div class="flex flex-col items-center gap-8">
    <div role="tablist" class="tabs tabs-boxed w-fit">
        <button
            disabled
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
            disabled
            role="tab"
            class="tab"
            on:click={() => setTab("Popular")}
            class:tab-active={activeTab === "Popular"}>Popular</button
        >
    </div>

    <div class="overflow-x-auto bg-base-100 p-4 rounded-lg">
        <table class="table">
            <!-- head -->
            <thead>
                <tr>
                    <th>Studio</th>
                    <th>Name</th>
                    <th class="hidden md:table-cell">Episodes</th>
                </tr>
            </thead>
            <tbody>
                {#if data && data.items.length > 0}
                    {#each data.items as anime}
                        <tr>
                            <td>
                                <div class="flex items-center gap-3">
                                    <a 
                                        href="{base}/player/{anime.slug}/1"
                                        class="avatar"
                                    >
                                        <div
                                            class="mask mask-squircle w-20 h-20"
                                        >
                                            <img
                                                src="{anime.imageurl}"
                                                alt="Avatar Tailwind CSS Component"
                                            />
                                        </div>
                                    </a>
                                    <div>
                                        <div class="mb-1">
                                            {anime.studio}
                                        </div>
                                        <span class="badge badge-secondary badge-sm">
                                            {anime.type}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="font-bold ">
                                    {@html anime.title_eng}
                                </div>
                                <br />
                                {#if anime.dub == 1}
                                    <span class="badge badge-accent badge-sm"
                                        >DUB</span
                                    >
                                {/if}
                            </td>
                            <td class="hidden md:table-cell">
                                {anime.episodes_count > 0 ? anime.episodes_count : ''}
                            </td>
                        </tr>
                    {/each}
                {:else if isLoading}
                    {#each [1, 2, 3] as _}
                        <tr>
                            <td class="text-center">
                                <div
                                    class="skeleton w-12 h-12 rounded-full"
                                ></div>
                            </td>
                            <td class="text-center">
                                <div class="skeleton h-4 w-20"></div>
                            </td>
                            <td class="text-center">
                                <div class="skeleton h-4 w-20"></div>
                            </td>
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td colspan="3" class="text-center">No data</td>
                    </tr>
                {/if}
            </tbody>
            <!-- foot -->
            <tfoot>
                <tr>
                    <th>Studio</th>
                    <th>Name</th>
                    <th class="hidden md:table-cell">Episodes</th>
                </tr>
            </tfoot>
        </table>
    </div>

    <div class="flex justify-center">
        <button disabled class="btn btn-primary" on:click={loadMore}>
            Load more
        </button>
    </div>
</div>
