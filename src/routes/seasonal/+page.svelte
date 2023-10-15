<script lang="ts">
    import { base } from "$app/paths";
    import { getCurrentSeason, getSeasonIndex } from "$lib";
    import PocketBase, { ListResult } from "pocketbase";
    import { onMount } from "svelte";

    import summer from "$lib/assets/icons/summer.svg";
    import winter from "$lib/assets/icons/winter.svg";
    import fall from "$lib/assets/icons/fall.svg";
    import spring from "$lib/assets/icons/spring.svg";
    import tea from "$lib/assets/icons/tea.svg";
    import home from "$lib/assets/icons/home.svg";

    const currentSeason = getCurrentSeason(winter, spring, summer, fall);
    const seasonIndex = getSeasonIndex();
    const year = new Date().getFullYear();

    const pb = new PocketBase("https://dev.opentrust.it/");
    let seasonalAnime = [] as any[];

    onMount(async () => {
        const seasonYearResult = await pb
            .collection("mal_seasonal")
            .getFullList({
                filter: `season = ${seasonIndex} && year = ${year}`,
            });
        seasonalAnime = seasonYearResult;
        console.log(seasonYearResult);
    });
</script>

<div class="flex justify-center align-middle mb-10">
    <ul
        class="menu bg-base-200 lg:menu-horizontal rounded-box tabs tabs-boxed gap-5"
    >
        <li class="tab tab-active h-auto p-0">
            <a href="{base}/seasonal">
                <svg class="w-5 h-5">
                    <use href="{currentSeason}#season-img" />
                </svg>
                Seasonal
            </a>
        </li>
        <li class="tab h-auto p-0">
            <a href="{base}/">
                <svg class="w-5 h-5">
                    <use href="{home}#home-img" />
                </svg>
                Latest
                <!-- <span class="badge badge-sm">99+</span> -->
            </a>
        </li>
        <li class="tab h-auto p-0">
            <a href="{base}/followed">
                <svg class="w-5 h-5">
                    <use href="{tea}#tea-img" />
                </svg>
                Followed
            </a>
        </li>
    </ul>
</div>

<div class="flex flex-wrap justify-center gap-8 md:gap-10 mb-10">
    {#if seasonalAnime}
        {#each seasonalAnime as anime}
            <div class="indicator">
                <a class="card w-36 md:w-52 bg-base-100 shadow-xl" href="#1">
                    <figure>
                        <img
                            class="w-full h-48 md:h-72 object-cover"
                            src={anime.img}
                            alt={anime.title}
                        />
                    </figure>
                    <div class="card-body">
                        <p
                            class="break-words truncate md:overflow-auto md:whitespace-normal overflow-auto"
                        >
                            {anime.title}
                        </p>
                    </div>
                </a>
            </div>
        {/each}
    {:else}
        <span class="loading loading-spinner loading-lg" />
    {/if}
</div>
