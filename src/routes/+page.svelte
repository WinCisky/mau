<script lang="ts">
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import AnimeList from "../components/anime-list.svelte";
    import { type Database } from "$lib/database.types";
    import { supabase } from "$lib/db_helper";

    type EpisodeWithAnime = Database["public"]["Tables"]["episodes"]["Row"] & {
        animes: Database["public"]["Tables"]["animes"]["Row"] | null;
    };
    let episodes = [] as EpisodeWithAnime[];
    let followedAnime = [] as any[];
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

    function loadMore() {
        page += 1;
        getAnimePage(page).then(({ data, error }) => {
            if (error) {
                console.error("Error fetching more episodes:", error);
            } else {
                episodes = [...episodes, ...data];
            }
        });
    }
</script>

<svelte:head>
    <title>Mau</title>
    <meta name="description" content="mau" />
</svelte:head>

<!-- needed for static compilation -->
<a href="{base}/player/ignore/me" class="hidden">&nbsp;</a>

<AnimeList {episodes} {followedAnime} {loadMore} />
