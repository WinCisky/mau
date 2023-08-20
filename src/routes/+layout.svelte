<script lang="ts">
    import PocketBase from "pocketbase";
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import type { Anime } from "$lib/db_helper";
    import "../app.css";

    const pb = new PocketBase("https://dev.opentrust.it/");

    let searchText = "";
    let searchResults: Anime[] = [];

    async function searchAnime() {
        const resultList = await pb.collection("mau_anime").getList(1, 20, {
            filter: `title_eng ~ '${searchText}' || title ~ '${searchText}'`,
            sort: "visite",
        });
        searchResults = resultList.items.map((item) => {
            return item as unknown as Anime;
        });
    }

    $: if (searchText.length >= 3) {
        searchAnime();
    } else {
        searchResults = [];
    }

    function toggleUserPreference(name: string, defaultValue: boolean = true) {
        const preference = localStorage.getItem("user_settings");
        const settings = JSON.parse(preference || "{}");
        if (name in settings) {
            settings[name] = !settings[name];
        } else {
            settings[name] = !defaultValue;
        }
        localStorage.setItem("user_settings", JSON.stringify(settings));
        //redirect to home
        window.location.href = `${base}/`;
    }

    let settings = {} as Record<string, boolean>;

    onMount(() => {
        settings = JSON.parse(
            localStorage.getItem("user_settings") || "{}"
        ) as Record<string, boolean>;
    });

    $: dub = settings.dub ?? true;
    $: ona = settings.ona ?? true;
    $: mirror = settings.mirror ?? false;
</script>

<div class="drawer">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content">
        <!-- Page content here -->
        <div class="navbar bg-base-300">
            <div class="flex-1">
                <div class="flex-none">
                    <label
                        for="my-drawer"
                        class="btn btn-square btn-ghost drawer-button"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="inline-block w-5 h-5 stroke-current"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            /></svg
                        >
                    </label>
                </div>
                <a class="btn btn-ghost normal-case text-xl" href="{base}/"
                    >Mau</a
                >
            </div>
            <div class="flex-none">
                <button
                    class="btn btn-ghost btn-circle"
                    on:click={() => {
                        // @ts-ignore
                        my_modal_search.showModal();
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
        </div>

        <div class="container mx-auto mt-6 p-4 md:p-2">
            <slot />
        </div>
    </div>
    <div class="drawer-side z-10">
        <label for="my-drawer" class="drawer-overlay" />
        <ul class="menu p-4 w-80 h-full bg-base-200 text-base-content">
            <!-- Sidebar content here -->
            <h2 class="text-2xl font-bold mb-6">Filters</h2>
            <li class="form-control">
                <label
                    class="cursor-pointer label flex justify-start gap-8 p-4"
                >
                    <input
                        type="checkbox"
                        class="toggle toggle-success"
                        checked={dub}
                        on:change={() => toggleUserPreference("dub")}
                    />
                    <span class="label-text">DUB</span>
                </label>
            </li>

            <li class="form-control">
                <label
                    class="cursor-pointer label flex justify-start gap-8 p-4"
                >
                    <input
                        type="checkbox"
                        class="toggle toggle-secondary"
                        checked={ona}
                        on:change={() => toggleUserPreference("ona")}
                    />
                    <span class="label-text">ONA</span>
                </label>
            </li>

            <h2 class="text-2xl font-bold my-6">Settings</h2>

            <li class="form-control">
                <label
                    class="cursor-pointer label flex justify-start gap-8 p-4"
                >
                    <input
                        type="checkbox"
                        class="toggle"
                        checked={mirror}
                        on:change={() => toggleUserPreference("mirror", false)}
                    />
                    <span class="label-text">Mirror</span>
                </label>
            </li>
        </ul>
    </div>

    <dialog id="my_modal_search" class="modal">
        <form method="dialog" class="modal-box w-fit max-w-none">
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
                            <a
                                class="card w-36 md:w-52 max-h-72 bg-base-100 shadow-xl image-full"
                                href={`${base}/player/${result.slug}/1`}
                                target="_self"
                            >
                                <figure>
                                    <img src={result.imageurl} alt="Cover" class="w-full" />
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
