<script lang="ts">
    import { base } from "$app/paths";
    import { onMount } from "svelte";

    type HistoryEntry = {
        animeId: number;
        episodeNumber: number;
        animeName: string;
        animeImage: string;
        timestamp: number;
    };

    const HISTORY_KEY = "anime_history_v1";
    let history: HistoryEntry[] = [];

    function loadHistory() {
        let raw =
            typeof window !== "undefined"
                ? localStorage.getItem(HISTORY_KEY)
                : null;
        if (raw) {
            try {
                history = JSON.parse(raw);
            } catch {
                history = [];
            }
        } else {
            history = [];
        }
    }

    onMount(() => {
        loadHistory();
    });
</script>

<svelte:head>
    <title>Mau - History</title>
</svelte:head>

<div class="w-full flex flex-col items-center mb-12 mt-6">
    <h1 class="text-2xl font-bold mb-4">History</h1>
    {#if history.length === 0}
        <div class="text-base-content/60">No history found.</div>
    {:else}
        <ul
            class="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical"
        >
            {#each history as entry, i}
                <li>
                    {#if i !== 0}
                        <hr />
                    {/if}
                    <div class="timeline-middle">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            class="h-5 w-5"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>
                    <a href="{base}/player/{entry.animeId}/{entry.episodeNumber}"
                        class="{i % 2 === 0 ? 'timeline-start mb-10 md:text-end md:items-end' : 'timeline-end md:mb-10'} flex flex-col gap-1">
                        <time class="font-mono italic">
                            {new Date(entry.timestamp).toLocaleDateString()}
                            &nbsp;|&nbsp; Episode {entry.episodeNumber}
                        </time>
                        <div class="text-lg font-black mb-2">{entry.animeName}</div>
                        <img
                            class="rounded-xl w-fit h-52 object-cover border"
                            src={entry.animeImage}
                            alt={entry.animeName}
                            loading="lazy"
                        />
                    </a>
                    {#if i !== history.length - 1}
                        <hr />
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>
