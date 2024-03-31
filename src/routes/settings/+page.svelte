<script lang="ts">
    import { onMount } from "svelte";
    import PocketBase from "pocketbase";
    import { base } from "$app/paths";
    import { capitalizeFirstLetter } from "$lib";
    import {
        UserSettingsDefaults,
        getUserSettings,
        setUserSettings,
        setUserTheme,
    } from "$lib/db_helper";
    import { selectedTheme } from "../../stores";
    // import "@weblogin/trendchart-elements";

    interface Provider {
        name: "google" | "github";
    }

    const pb = new PocketBase("https://dev.opentrust.it/");
    const themes = [
        "default",
        "light",
        "dark",
        "cupcake",
        "bumblebee",
        "emerald",
        "corporate",
        "synthwave",
        "retro",
        "cyberpunk",
        "valentine",
        "halloween",
        "garden",
        "forest",
        "aqua",
        "lofi",
        "pastel",
        "fantasy",
        "wireframe",
        "black",
        "luxury",
        "dracula",
        "cmyk",
        "autumn",
        "business",
        "acid",
        "lemonade",
        "night",
        "coffee",
        "winter",
        "dim",
        "nord",
        "sunset",
    ];

    let username = pb.authStore.model?.username ?? "anon";
    let chillImg = "/chill.png";
    let isLogged = false;
    let joinedYear: number = new Date().getFullYear();
    let settingsInitialized = false;
    let ona = true;
    let dub = true;
    let mirror = true;
    let nsfw = false;
    let settings = new UserSettingsDefaults();

    // save theme on change
    $: if (selectedTheme) {
        setUserTheme(pb, $selectedTheme);
    }

    $: {
        ona;
        if (settingsInitialized && ona !== settings.ona) {
            settings.ona = ona;
            setUserSettings(pb, settings);
        }
    }
    $: {
        dub;
        if (settingsInitialized && dub !== settings.dub) {
            settings.dub = dub;
            setUserSettings(pb, settings);
        }
    }

    $: {
        mirror;
        if (settingsInitialized && mirror !== settings.mirror) {
            settings.mirror = mirror;
            setUserSettings(pb, settings);
        }
    }

    $: {
        nsfw;
        if (settingsInitialized && nsfw !== settings.nsfw) {
            settings.nsfw = nsfw;
            setUserSettings(pb, settings);
        }
    }

    onMount(() => {
        isLogged = pb.authStore.isValid;
        if (isLogged) {
            let createdDate = new Date(pb.authStore.model!.created);
            joinedYear = createdDate.getFullYear();
        }

        getUserSettings(pb).then((res) => {
            if (!res) return;
            settings.dub = res.dub;
            settings.ona = res.ona;
            settings.mirror = res.mirror;
            settings.nsfw = res.nsfw;
            ona = res.ona;
            dub = res.dub;
            mirror = res.mirror;
            nsfw = res.nsfw;
            // set settingsInitialized to true after 1 s
            setTimeout(() => {
                settingsInitialized = true;
            }, 1000);
        });
    });

    async function providerLogin(provider: Provider) {
        const authData = await pb
            .collection("users")
            .authWithOAuth2({ provider: provider.name });
        if (authData) {
            isLogged = true;
            username = pb.authStore.model?.username ?? "anon";
        }
    }

    function logout() {
        pb.authStore.clear();
        isLogged = false;
        username = "anon";
    }
</script>

<svelte:head>
    <title>Mau settings</title>
</svelte:head>

{#if isLogged}
    <div class="flex flex-col w-full justify-center items-center gap-6">
        <div
            class="flex flex-col w-full gap-6 max-w-xl justify-center items-center"
        >
            <div
                class="grid flex-grow card bg-base-300 rounded-box place-items-center justify-start p-6 items-start w-full md:w-auto"
            >
                <div class="flex flex-col gap-6">
                    <h2 class="text-xl font-semibold">User profile</h2>
                    <div class="flex flex-col md:flex-row gap-10">
                        <div class="avatar md:justify-center items-center">
                            <div class="w-20 h-20 rounded-full">
                                <img
                                    src="https://api.dicebear.com/7.x/notionists/svg?seed={username}"
                                    alt="avatar"
                                />
                            </div>
                        </div>
                        <div class="flex flex-col justify-center gap">
                            <div class="text-lg font-semibold">{username}</div>
                            <div>{pb.authStore.model?.email}</div>
                            <div class="text-sm">joined in {joinedYear}</div>
                        </div>
                        <div class="flex md:justify-center items-center">
                            <button class="btn btn-warning" on:click={logout}
                                >Logout</button
                            >
                        </div>
                    </div>
                </div>
            </div>
            <div
                class="grid flex-grow card bg-base-300 rounded-box place-items-center justify-start p-6 items-start w-full md:w-auto"
            >
                <div class="flex flex-col gap-6">
                    <h2 class="text-xl font-semibold">Preferences</h2>
                    <div class="flex flex-col gap-4">
                        <div class="form-control w-52">
                            <div class="flex gap-4 justify-between">
                                <p>DUB</p>
                                <input
                                    type="checkbox"
                                    class="toggle toggle-accent"
                                    bind:checked={dub}
                                />
                            </div>
                        </div>
                        <div class="form-control w-52">
                            <div class="flex gap-4 justify-between">
                                <p>ONA</p>
                                <input
                                    type="checkbox"
                                    class="toggle toggle-secondary"
                                    bind:checked={ona}
                                />
                            </div>
                        </div>
                        <!-- nsfw -->
                        <div class="form-control w-52">
                            <div class="flex gap-4 justify-between">
                                <p>NSFW</p>
                                <input
                                    type="checkbox"
                                    class="toggle toggle-danger"
                                    bind:checked={nsfw}
                                />
                            </div>
                        </div>
                        <div>
                            <label class="label" for="theme-select">Theme</label
                            >
                            <select
                                bind:value={$selectedTheme}
                                id="theme-select"
                                class="select w-full max-w-xs"
                            >
                                {#each themes as theme (theme)}
                                    <option value={theme}
                                        >{capitalizeFirstLetter(theme)}</option
                                    >
                                {/each}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {#if false}
            <div class="divider"></div>
            <div
                class="grid card bg-base-300 rounded-box place-items-center justify-start p-4 items-start"
            >
                <div class="flex flex-col gap-6">
                    <h2 class="text-xl font-semibold">Stats</h2>
                    <div
                        class="stats stats-vertical lg:stats-horizontal shadow"
                    >
                        <div class="stat">
                            <div class="stat-title">Downloads</div>
                            <div class="stat-value">31K</div>
                            <div class="stat-desc">Jan 1st - Feb 1st</div>
                        </div>

                        <div class="stat">
                            <div class="stat-title">New Users</div>
                            <div class="stat-value">4,200</div>
                            <div class="stat-desc">↗︎ 400 (22%)</div>
                        </div>

                        <div class="stat">
                            <div class="stat-title">New Registers</div>
                            <div class="stat-value">1,200</div>
                            <div class="stat-desc">↘︎ 90 (14%)</div>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
{:else}
    <div class="flex flex-col w-full">
        <div
            class="hero min-h-[calc(100vh-9rem)] rounded-xl"
            style="background-image: url({base + chillImg});"
        >
            <div class="hero-overlay bg-opacity-60 rounded-xl"></div>
            <div class="hero-content text-center text-neutral-content">
                <div class="max-w-md">
                    <h1 class="mb-5 text-5xl font-bold">Hello there</h1>
                    <div
                        class="flex gap-4 flex-col md:flex-row justify-center mt-10"
                    >
                        <button
                            class="btn"
                            on:click={() => providerLogin({ name: "google" })}
                        >
                            Login with Google
                            <svg
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-6 w-6"
                                viewBox="0 0 48 48"
                                xmlns:xlink="http://www.w3.org/1999/xlink"
                                style="display: block;"
                            >
                                <path
                                    fill="#EA4335"
                                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                ></path>
                                <path
                                    fill="#4285F4"
                                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                ></path>
                                <path
                                    fill="#FBBC05"
                                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                                ></path>
                                <path
                                    fill="#34A853"
                                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                ></path>
                                <path fill="none" d="M0 0h48v48H0z"></path>
                            </svg>
                        </button>
                        <button
                            class="btn"
                            on:click={() => providerLogin({ name: "github" })}
                        >
                            Login with GitHub
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
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
