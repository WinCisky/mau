<script lang="ts">
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import "../app.css";

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
            <div class="flex-none" />
        </div>

        <div class="container mx-auto mt-6 p-4 md:p-2">
            <slot />
        </div>
    </div>
    <div class="drawer-side z-10">
        <label for="my-drawer" class="drawer-overlay" />
        <ul class="menu p-4 w-80 h-full bg-base-200 text-base-content">
            <!-- Sidebar content here -->
            <h2 class="text-2xl font-bold mb-6">
                Filters
            </h2>
            <li class="form-control">
                    <label class="cursor-pointer label flex justify-start gap-8 p-4">
                        <span class="label-text">DUB</span>
                        <input
                            type="checkbox"
                            class="toggle toggle-success"
                            checked={dub}
                            on:change={() => toggleUserPreference("dub")}
                        />
                    </label>
            </li>
            
            <li class="form-control">
                <label class="cursor-pointer label flex justify-start gap-8 p-4">
                    <span class="label-text">ONA</span>
                    <input
                        type="checkbox"
                        class="toggle toggle-secondary"
                        checked={ona}
                        on:change={() => toggleUserPreference("ona")}
                    />
                </label>
        </li>
        </ul>
    </div>
</div>
