<script lang="ts">
    import "../app.css";
    import { base } from "$app/paths";

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
                class="bg-base-300 z-50 absolute right-4 md:right-8 bottom-4 flex rounded-md p-2 pointer-events-auto left-4 sm:left-auto border-2 border-base-content"
            >
                <div class="flex-1 hidden md:block">
                    <a class="btn btn-ghost normal-case text-xl" href={myBase}
                        >Mau</a
                    >
                </div>
                <div class="flex-1">
                    <a class="btn btn-ghost btn-circle md:hidden" href={myBase}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="size-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                            />
                        </svg>
                    </a>
                </div>
                <div class="flex-none mr-2">
                    <a
                        class="btn btn-ghost btn-circle"
                        href="{base}/ranking"
                        aria-label="Ranking"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
                            />
                        </svg>
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
