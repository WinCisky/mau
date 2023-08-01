<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    const WATCH_TRESHOLD = 0.75;

    const { anime, episode } = $page.params;

    let watched = false;
    let time = 0;
	let duration: number;
	let paused = true;

    // rough estimate of how many seconds the user has watched
    let secondsWatched = 0;
    let watchTimer = 0;

    onMount(() => {
        watchTimer = setInterval(() => {
            if (!paused) {
                secondsWatched++;
            }

            if (watched) {
                clearInterval(watchTimer);
            }
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(watchTimer);
    });
    
    $: {
        if (
            !watched &&
            duration && 
            typeof duration === 'number' &&
            duration > 0
        ) {
            const percentageWatched = secondsWatched / duration;
            if (percentageWatched > WATCH_TRESHOLD) {
                watched = true;
                console.log('User has watched more than 75% of the video');
            }
        }
    }
</script>

<video controls
		src="https://sveltejs.github.io/assets/caminandes-llamigos.mp4"
		bind:currentTime={time}
		bind:duration
		bind:paused
	>
		<track kind="captions" />
	</video>