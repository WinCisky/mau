<script lang="ts">
    import { base } from "$app/paths";
    import { type Database } from "$lib/database.types";
    import { supabase } from "$lib/db_helper";
    import { onMount, tick } from "svelte";

    type Anime = Database["public"]["Tables"]["animes"]["Row"];

    let anime = null as Anime[] | null;
    let searchQuery = "";
    let searchInput: HTMLInputElement;
    let searchTimeout: ReturnType<typeof setTimeout>;

    async function searchAnime(query: string): Promise<Anime[] | null> {
        if (query.length < 3) {
            return null;
        }
        
        let { data, error } = await supabase
            .from("animes")
            .select("*")
            .or(`name.ilike.%${query}%,alt_name.ilike.%${query}%`)
            .order("name", { ascending: true });
            
        if (error) {
            console.error("Error searching anime:", error);
            return null;
        }
        
        return data;
    }

    async function handleSearch() {
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Debounce search by 300ms
        searchTimeout = setTimeout(async () => {
            anime = await searchAnime(searchQuery);
        }, 300);
    }

    onMount(async () => {
        // Focus the search input when the page loads
        await tick();
        searchInput?.focus();
    });
</script>

<svelte:head>
    <title>Mau - search anime</title>
</svelte:head>

<div class="w-full flex flex-col items-center mb-12 mt-6">
    <label class="input input-bordered w-full max-w-md">
        <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke-width="2.5"
            fill="none"
            stroke="currentColor"
            >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
            </g>
        </svg>
        <input 
            type="search" 
            placeholder="Search anime..." 
            bind:value={searchQuery}
            bind:this={searchInput}
            on:input={handleSearch}
        />
    </label>
    
    {#if searchQuery.length > 0 && searchQuery.length < 3}
        <div class="text-sm text-base-content/60 mt-2">
            Type at least 3 characters to search
        </div>
    {/if}
</div>

<div class="flex flex-wrap justify-center gap-8 md:gap-10 mb-10 mt-0 md:mt-4">
    {#if searchQuery.length >= 3}
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
                        <img
                            class="rounded-xl w-full h-full object-cover"
                            src={an.image_url}
                            alt={an.name}
                            loading="{index > 1 ? 'lazy' : 'eager'}"
                        />
                    </a>
                </div>
            {/each}
        {:else if anime === null}
            <!-- Loading state -->
            <div class="text-center w-full">
                <span class="loading loading-spinner loading-lg"></span>
                <p class="mt-4 text-base-content/60">Searching...</p>
            </div>
        {:else}
            <!-- No results -->
            <div class="text-center w-full">
                <p class="text-lg text-base-content/60">No anime found for "{searchQuery}"</p>
                <p class="text-sm text-base-content/40 mt-2">Try a different search term</p>
            </div>
        {/if}
    {:else if searchQuery.length === 0}
        <!-- Welcome state -->
        <div class="text-center w-full">
            <div class="text-6xl mb-4">🔍</div>
            <p class="text-xl text-base-content/60">Search for your favorite anime</p>
            <p class="text-sm text-base-content/40 mt-2">Start typing to find anime by name</p>
        </div>
    {/if}
</div>
