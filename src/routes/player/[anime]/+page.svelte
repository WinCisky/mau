<script lang="ts">
    import { base } from "$app/paths";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { supabase } from "$lib/db_helper";
    import { onMount } from "svelte";

    const { anime = "" } = $page.params;
    const backendEndpoint = "https://mau.simo.deno.net";

    let errorMessage = "";

    onMount(async () => {
        const animeId = Number(anime);

        if (!Number.isInteger(animeId)) {
            errorMessage = "Invalid anime id";
            return;
        }

        const { data, error } = await supabase
            .from("episodes")
            .select("episode_number")
            .eq("anime_id", animeId)
            .order("episode_number", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            errorMessage = "Unable to load episodes for this anime";
            return;
        }

        if (data) {
            await goto(`${base}/player/${animeId}/${data.episode_number}`, {
                replaceState: true
            });
            return;
        }

        const { data: animeData, error: animeError } = await supabase
            .from("animes")
            .select("slug")
            .eq("id", animeId)
            .maybeSingle();

        if (animeError || !animeData?.slug) {
            errorMessage = "Anime not found";
            return;
        }

        const response = await fetch(
            `${backendEndpoint}/episodes?anime=${encodeURIComponent(animeData.slug)}`
        );
        const payload = await response.json();

        if (!response.ok || payload.error) {
            errorMessage = payload.error ?? "No episodes found for this anime";
            return;
        }

        const latestEpisode = Number(payload.last_episode_number);

        if (!Number.isFinite(latestEpisode)) {
            errorMessage = "No episodes found for this anime";
            return;
        }

        await goto(`${base}/player/${animeId}/${latestEpisode}`, {
            replaceState: true
        });
    });
</script>

<svelte:head>
    <title>Mau - Player</title>
</svelte:head>

<div class="flex min-h-[50vh] items-center justify-center">
    {#if errorMessage}
        <p class="text-base-content/60">{errorMessage}</p>
    {:else}
        <span class="loading loading-spinner loading-lg" aria-label="Loading latest episode"></span>
    {/if}
</div>
