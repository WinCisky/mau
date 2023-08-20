<script lang="ts">
    import PocketBase from "pocketbase";
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import type { Anime } from "$lib/db_helper";
    import "../app.css";

    const pb = new PocketBase("https://dev.opentrust.it/");

    let searchText = "";
    let searchResults: Anime[] = [];

    async function saveUserData() {
        if (!pb.authStore.isValid) return;
        if (typeof localStorage === "undefined") return;

        const userId = pb.authStore.model?.id;
        const watchedVideos = JSON.parse(localStorage.getItem("watchedVideos") ?? "{}");

        //get previous settings if any
        const userData = await pb.collection('mau_users').getList(1, 1, {
            filter: `id = ${userId}`,
        });

        if (userData.items.length > 0) {
            // use previous settings
            localStorage.setItem("user_settings", JSON.stringify({
                "ona": userData.items[0].ona,
                "dub": userData.items[0].dub,
                "mirror": userData.items[0].mirror,
            }));
            // merge watched videos
            const mergedWatchedVideos = {...userData.items[0].watched, ...watchedVideos};
            // update watched videos
            await pb.collection('mau_users').update(userData.items[0].id, {
                "watched": mergedWatchedVideos
            });
        } else {
            const user_settings = JSON.parse(localStorage.getItem("user_settings") ?? "{}");
            const data = {
                "ona": user_settings.ona ?? true,
                "dub": user_settings.dub ?? true,
                "mirror": user_settings.mirror ?? false,
                "watched": watchedVideos,
            };

            await pb.collection('mau_users').create(data);
        }
    }

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

            <h2 class="text-2xl font-bold my-6 mt-auto">
                {pb.authStore.isValid && pb.authStore.model?.username
                    ? pb.authStore.model?.username.length > 19
                        ? pb.authStore.model?.username.substring(0, 19) + "..."
                        : pb.authStore.model?.username
                    : "Account"}
            </h2>
            <button
                class="btn btn-outline"
                on:click={async () => {
                    if (pb.authStore.isValid) {
                        pb.authStore.clear();
                    } else {
                        await pb
                            .collection("users")
                            .authWithOAuth2({ provider: "github" });
                        if (pb.authStore.isValid) {
                            saveUserData();
                        }
                    }
                    // console.log(pb.authStore);
                    window.location.href = `${base}/`;
                }}
            >
                {pb.authStore.isValid ? "Logout" : "Login"}
                {#if !pb.authStore.isValid}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6 fill-current"
                        viewBox="0 0 100 100"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                        /></svg
                    >
                {/if}
            </button>
        </ul>
    </div>

    <dialog id="my_modal_search" class="modal modal-top md:modal-middle">
        <form method="dialog" class="modal-box w-full md:w-fit max-w-none">
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
