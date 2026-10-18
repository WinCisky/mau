<script lang="ts">
    import { resolve } from "$app/paths";
    import { onMount } from "svelte";
    import AnimeList from "../components/anime-list.svelte";
    import { type Database } from "#lib/database.types.ts";
    import { supabase } from "#lib/db_helper.ts";

    type EpisodeWithAnime = Database["public"]["Tables"]["episodes"]["Row"] & {
        animes: Database["public"]["Tables"]["animes"]["Row"] | null;
    };
    let episodes = [] as EpisodeWithAnime[];
    let page = 1;
    const perPage = 20;

    function getAnimePage(page: number) {
        return supabase
            .from('episodes')
            .select('*, animes!fk_anime_id(*)')
            .range((page - 1) * perPage, page * perPage - 1)
            .order('created_at', { ascending: false });
    }

    onMount(async () => {
        const { data, error } = await getAnimePage(page);
        if (error) {
            console.error("Error fetching episodes:", error);
        } else {
            episodes = data;
        }
    });

    async function loadMore() {
        const { data, error } = await getAnimePage(page + 1);
        if (error) {
            console.error("Error fetching more episodes:", error);
            return;
        }
        page += 1;
        episodes = [...episodes, ...data];
    }
</script>

<svelte:head>
    <title>Mau</title>
    <meta name="description" content="mau" />
</svelte:head>

<!-- needed for static compilation -->
<a href={resolve('/player/[anime]/[episode]', { anime: 'ignore', episode: 'me' })} class="hidden" aria-label="Static player episode route">&nbsp;</a>
<a href={resolve('/player/[anime]', { anime: 'ignore' })} class="hidden" aria-label="Static player route">&nbsp;</a>

<AnimeList {episodes} {loadMore} />
