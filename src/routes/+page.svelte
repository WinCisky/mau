<script lang="ts">
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import AnimeList from "../components/anime-list.svelte";
    import { type Database } from "$lib/database.types";

    import { createClient } from "@supabase/supabase-js";

    const supabaseUrl = "https://oowupapsfsiiwawhqhty.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vd3VwYXBzZnNpaXdhd2hxaHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjA5OTYsImV4cCI6MjA2NjA5Njk5Nn0.Lo7Hp1R_r7cYElql9Yy03mR8OaE-H7EEh8CwFA5hIpo";

    export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

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
            .select('*, animes(*)')
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
