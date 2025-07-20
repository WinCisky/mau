<script lang="ts">
    import { base } from "$app/paths";
    import { decodeHTMLEntities, getCurrentSeason } from "$lib";
    import { page } from "$app/stores";
    import { type Database } from "$lib/database.types";
    import { supabase } from "$lib/db_helper";
    import { onMount } from "svelte";
    
    // Import seasonal icons
    import WinterIcon from "$lib/assets/icons/winter.svg?raw";
    import SpringIcon from "$lib/assets/icons/spring.svg?raw";
    import SummerIcon from "$lib/assets/icons/summer.svg?raw";
    import FallIcon from "$lib/assets/icons/fall.svg?raw";

    const backendEndpoint = "https://slim-boar-34.deno.dev";

    type Anime = Database["public"]["Tables"]["animes"]["Row"];

    let anime = null as Anime[] | null;
    const currentSeason = getCurrentSeason();
    let selectedSeason = currentSeason;
    const year = new Date().getFullYear();

    const SEASONS = [ "winter", "spring", "summer", "fall" ];

    // Map seasons to their corresponding icons
    const seasonIcons = {
        winter: WinterIcon,
        spring: SpringIcon,
        summer: SummerIcon,
        fall: FallIcon
    };

    // Capitalize season names for display
    const seasonNames = {
        winter: "Winter",
        spring: "Spring",
        summer: "Summer",
        fall: "Fall"
    };

    function isPastSeason(seasonName: string): boolean {
        const currentIndex = SEASONS.indexOf(currentSeason);
        const seasonIndex = SEASONS.indexOf(seasonName);
        return seasonIndex < currentIndex;
    }

    function isCurrentSeason(seasonName: string): boolean {
        return seasonName === currentSeason;
    }

    async function getSeasonalAnime(targetSeason: string = selectedSeason): Promise<Anime[] | null> {
        let { data, error } = await supabase
            .from("seasonal")
            .select("*")
            .eq("season", targetSeason)
            .eq("year", year)
            .order("created_at", { ascending: false });
        if (error || !data) {
            console.error("Error fetching seasonal anime:", error);
            return null;
        }
        
        const animeIds = data.map(item => item.anime_id);
        if (animeIds.length === 0) return [];

        const { data: animeData, error: animeError } = await supabase
            .from("animes")
            .select("*")
            .in("id", animeIds);

        if (animeError || !animeData) {
            console.error("Error fetching anime details:", animeError);
            return null;
        }

        return animeData;
    }

    onMount(async () => {
        anime = await getSeasonalAnime();
    });
</script>

<svelte:head>
    <title>Mau - {seasonNames[selectedSeason as keyof typeof seasonNames]} {year} anime</title>
</svelte:head>

<div class="flex gap-8 justify-center items-center flex-wrap mb-8">
    <div class="">
        <h1 class="text-3xl font-bold">{year}</h1>
    </div>
    <ul class="timeline">
        {#each SEASONS as seasonName, index}
            {@const isPast = isPastSeason(seasonName)}
            {@const isCurrent = isCurrentSeason(seasonName)}
            
            <li>
                {#if index > 0}
                    <hr class="{isPast || isCurrent ? 'bg-accent' : 'bg-base-300'}" />
                {/if}
                
                {#if index % 2 === 0}
                    <button 
                        class="timeline-start timeline-box transition-all duration-200 hover:scale-105 {
                            isCurrent || isPast ? 'bg-accent text-accent-content' :
                            'bg-base-200 text-base-content hover:bg-base-300'
                        }"
                    >
                        {seasonNames[seasonName as keyof typeof seasonNames]}
                    </button>
                {:else}
                    <button 
                        class="timeline-end timeline-box transition-all duration-200 hover:scale-105 {
                            isCurrent || isPast ? 'bg-accent text-accent-content' :
                            'bg-base-200 text-base-content hover:bg-base-300'
                        }"
                    >
                        {seasonNames[seasonName as keyof typeof seasonNames]}
                    </button>
                {/if}
                
                <div class="timeline-middle">
                    <div class="w-8 h-8 p-1 rounded-full {
                        isCurrent || isPast ? 'bg-accent text-accent-content' :
                        'bg-base-300 text-base-content'
                    }">
                        {@html seasonIcons[seasonName as keyof typeof seasonIcons]}
                    </div>
                </div>
                
                {#if index < SEASONS.length - 1}
                    <hr class="{isPast ? 'bg-accent' : 'bg-base-300'}" />
                {/if}
            </li>
        {/each}
    </ul>
</div>

<div class="flex flex-wrap justify-center gap-8 md:gap-10 mb-10 mt-0 md:mt-4">
    {#if anime && anime.length > 0}
        {#each anime as an, index}
            <div class="indicator h-52 md:h-80">
                {#if an.dubbed}
                    <span
                        class="indicator-item indicator-bottom indicator-center badge badge-secondary"
                    >DUB</span>
                {/if}
                <a
                    class="rounded-xl w-36 md:w-52 bg-base-100 shadow-xl"
                    href={`${base}/player/${an.id}/1`}
                    aria-label={`Watch ${an.name} episode 1`}
                >
                    <!-- add episode number -->
                    <img
                        class="rounded-xl w-full h-full object-cover"
                        src={an.image_url}
                        alt={an.name}
                        loading="{index > 1 ? 'lazy' : 'eager'}"
                    />
                </a>
            </div>
        {/each}
    {/if}
</div>

<style global>
    .circle-background::after {
        background: none;
        display: none;
    }
</style>