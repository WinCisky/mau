<script lang="ts">
    import PocketBase from "pocketbase";
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import type { Anime } from "$lib/db_helper";
    import { getUserSettings, searchAnime } from "$lib/db_helper";
    import { getUserWatchedVideos } from "$lib/settings_helper";
    import "../app.css";
    import { selectedTheme, watched, history } from "../stores";

    const pb = new PocketBase("https://dev.opentrust.it/");
    const username = pb.authStore.model?.username ?? "anon";

    let searchText = "";
    let searchResults: Anime[] = [];

    $: if (searchText.length >= 3) {
        searchAnime(pb, searchText).then((res) => {
            searchResults = res;
        });
    } else {
        searchResults = [];
    }

    let settings = {} as Record<string, boolean>;

    onMount(async () => {
        getUserSettings(pb).then((res) => {
            if (res && res.theme.length > 0) {
                $selectedTheme = res.theme;
            }
            settings.dub = res?.dub ?? true;
            settings.ona = res?.ona ?? true;
        });

        if (pb.authStore.isValid) {
            $history = await getUserWatchedVideos(pb);

            const episodesWatched = [];
            for (const episodeWatched of $history) {
                episodesWatched.push(episodeWatched.episode);
            }
            $watched = episodesWatched;
        }
    });
</script>

<div class="drawer">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content circle-background">
        <!-- Page content here -->
        <input
            type="checkbox"
            bind:value={$selectedTheme}
            checked
            class="hidden checkbox theme-controller"
        />
        <div class="navbar bg-base-300">
            <div class="flex-1">
                <a class="btn btn-ghost normal-case text-xl" href={base || "/"}
                    >Mau</a
                >
            </div>
            <div class="flex-none mr-2">
                <a
                    class="btn btn-ghost btn-circle"
                    href="{base}/ranking"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
                        />
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
                        />
                    </svg>
                </a>
                <button
                    class="btn btn-ghost btn-circle"
                    on:click={() => {
                        // @ts-ignore
                        document.getElementById("my_modal_search").showModal();
                        searchText = "";
                        searchResults = [];
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        /></svg
                    >
                </button>
            </div>
            <div class="flex-none mr-2">
                <label for="my-drawer" class="btn btn-ghost btn-circle">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24"
                        viewBox="0 -960 960 960"
                        width="24"
                        ><path
                            fill="currentColor"
                            d="M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z"
                        /></svg
                    >
                </label>
            </div>
            <div class="dropdown dropdown-end">
                <a
                    href="{base}/settings"
                    class="btn btn-ghost btn-circle avatar"
                >
                    <div class="w-10 rounded-full">
                        <img
                            alt="Tailwind CSS Navbar component"
                            src="https://api.dicebear.com/7.x/notionists/svg?seed={username}"
                        />
                    </div>
                </a>
            </div>
        </div>

        <div class="container mx-auto mt-6 p-4 md:p-2 min-h-[calc(100vh-66px)]">
            <slot />
        </div>
    </div>
    <div class="drawer-side z-10">
        <label for="my-drawer" class="drawer-overlay" />
        <div
            class="menu p-4 w-80 h-full bg-base-200 text-base-content overflow-hidden flex-nowrap"
        >
            <!-- Sidebar content here -->
            <h2 class="text-lg font-semibold mb-6">History</h2>
            <div class="flex flex-col justify-center gap-4 pb-10">
                <!-- if not logged in -->
                {#if !pb.authStore.isValid}
                    <a
                        href={`${base}/settings`}
                        data-sveltekit-reload
                        class="btn btn-info w-full"
                    >
                        Login
                    </a>
                {/if}
                {#each $history as item}
                    <a
                        class="card bg-base-300 shadow-xl image-full max-h-24"
                        data-sveltekit-reload
                        href={`${base}/player/${item.expand.episode.expand.anime.slug}/${item.expand.episode.number}`}
                    >
                        <figure class="opacity-50">
                            <img
                                src={item.expand.episode.expand.anime.imageurl}
                                class="w-full"
                                alt={item.expand.episode.expand.anime.title_eng}
                            />
                        </figure>
                        <div class="card-body !p-2">
                            <p class="text-lg font-bold flex items-end flex-1">
                                {item.expand.episode.expand.anime.title_eng
                                    .length > 25
                                    ? `${item.expand.episode.expand.anime.title_eng.slice(
                                          0,
                                          25,
                                      )}...`
                                    : item.expand.episode.expand.anime
                                          .title_eng}
                            </p>
                            <p
                                class="text-sm font-semibold flex items-start flex-1"
                            >
                                Episode: {item.expand.episode.number}
                            </p>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    </div>

    <dialog id="my_modal_search" class="modal modal-top">
        <form method="dialog" class="modal-box w-full !max-w-none">
            <div class="flex flex-col justify-center items-center">
                <div>
                    <input
                        type="text"
                        placeholder="Search..."
                        class="input input-bordered w-full max-w-xs"
                        bind:value={searchText}
                    />
                </div>
                {#if searchResults.length > 0}
                    <div
                        class="mt-6 h-[60vh] md:max-w-[80vw] md:min-w-[40vw] flex flex-wrap justify-center gap-4 md:gap-8 pb-10 overflow-y-auto"
                    >
                        {#each searchResults as result}
                            <!-- TODO: fix url with proper anime link -->
                            <a
                                class="card w-36 md:w-52 max-h-72 bg-base-100 shadow-xl image-full"
                                href={`${base}/player/${result.slug}/1`}
                                target="_self"
                            >
                                <figure>
                                    <img
                                        src={result.imageurl}
                                        alt="Cover"
                                        class="w-full"
                                    />
                                </figure>
                                <div class="card-body w-36 md:w-52">
                                    <h2 class="card-title">
                                        {result.title_eng}
                                    </h2>
                                </div>
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>
        </form>
        <form method="dialog" class="modal-backdrop">
            <button class="border-transparent focus:outline-none">close</button>
        </form>
    </dialog>
</div>

<style>
    /* clip path animation float */
    @keyframes float-right {
        0% {
            clip-path: circle(30rem at 5rem 5rem);
        }
        50% {
            clip-path: circle(30rem at 5rem 10rem);
        }
        100% {
            clip-path: circle(30rem at 5rem 5rem);
        }
    }

    @keyframes float-left {
        0% {
            clip-path: circle(30rem at right 70rem);
        }
        50% {
            clip-path: circle(30rem at right 65rem);
        }
        100% {
            clip-path: circle(30rem at right 70rem);
        }
    }

    @media (min-width: 768px) {
        .circle-background::after {
            z-index: -2;
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                theme("colors.primary"),
                theme("colors.secondary")
            );
            clip-path: circle(30rem at 5rem 5rem);
            animation: float-right 60s ease-in-out infinite;
        }

        .circle-background::before {
            z-index: -2;
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                theme("colors.secondary"),
                theme("colors.primary")
            );
            clip-path: circle(30rem at right 70rem);
            animation: float-left 60s ease-in-out infinite;
        }
    }
</style>
