<script lang="ts">
    import "../app.css";
    import { base } from "$app/paths";

    import WinterIcon from "$lib/assets/icons/winter.svg?raw";
    import SpringIcon from "$lib/assets/icons/spring.svg?raw";
    import SummerIcon from "$lib/assets/icons/summer.svg?raw";
    import FallIcon from "$lib/assets/icons/fall.svg?raw";
    import HomeIcon from "$lib/assets/icons/home.svg?raw";
    import SearchIcon from "$lib/assets/icons/search.svg?raw";
    import { getCurrentSeason } from "$lib";

    const seasonIcons = {
        winter: WinterIcon,
        spring: SpringIcon,
        summer: SummerIcon,
        fall: FallIcon
    };

    const seasonName = getCurrentSeason();

    $: myBase = base ? (base.endsWith("/") ? base : `${base}/`) : "/";
</script>

<div class="drawer">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content circle-background mb-12">
        <!-- Page content here -->
        <input
            type="checkbox"
            checked
            class="hidden checkbox theme-controller"
        />
        <div class="h-dvh w-screen fixed z-10 pointer-events-none">
            <div
                class="flex justify-between gap-2 bg-base-300 z-50 absolute right-4 md:right-8 bottom-4 flex rounded-md p-2 pointer-events-auto left-4 sm:left-auto border-2 border-base-content"
            >
                <div class="">
                    <a class="btn btn-ghost normal-case text-xl" href={myBase}
                        >Mau</a
                    >
                </div>
                <div class="flex items-center gap-4">
                    <!-- home icon -->
                    <a class="btn btn-ghost btn-circle w-8 h-8 h-full" href={myBase} aria-label="Home">
                        {@html HomeIcon}
                    </a>
                    <!-- seasonal icon -->
                    <a class="btn btn-ghost btn-circle w-8 h-8 h-full" href="{base}/seasonal" aria-label="Home">
                        {@html seasonIcons[seasonName as keyof typeof seasonIcons]}
                    </a>
                    <!-- search icon -->
                    <a class="btn btn-ghost btn-circle w-8 h-8 h-full" href="{base}/search" aria-label="Search">
                        {@html SearchIcon}
                    </a>
                </div>
            </div>
        </div>

        <div
            class="container mx-auto mt-2 md:mt-4 p-4 md:p-2 min-h-[calc(100vh-66px)]"
        >
            <slot />
        </div>
    </div>
</div>

<style>
    /* clip path animation float */
    @keyframes float-right {
        0% {
            clip-path: circle(30rem at 5rem 5rem);
        }
        50% {
            clip-path: circle(30rem at 5rem 10rem);
        }
        100% {
            clip-path: circle(30rem at 5rem 5rem);
        }
    }

    @keyframes float-left {
        0% {
            clip-path: circle(30rem at right 70rem);
        }
        50% {
            clip-path: circle(30rem at right 65rem);
        }
        100% {
            clip-path: circle(30rem at right 70rem);
        }
    }

    @media (min-width: 768px) {
        .circle-background::after {
            z-index: -2;
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                var(--color-primary),
                var(--color-secondary)
            );
            clip-path: circle(30rem at 5rem 5rem);
            animation: float-right 60s ease-in-out infinite;
        }

        .circle-background::before {
            z-index: -2;
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                var(--color-secondary),
                var(--color-primary)
            );
            clip-path: circle(30rem at right 70rem);
            animation: float-left 60s ease-in-out infinite;
        }
    }
</style>
