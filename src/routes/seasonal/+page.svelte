<script lang="ts">
    import { base } from "$app/paths";
    import { getCurrentSeason, getSeasonIndex } from "$lib";
    import PocketBase, { ListResult } from "pocketbase";
    import { onMount } from "svelte";
    import { saveUserData } from "$lib/settings_helper";

    import summer from "$lib/assets/icons/summer.svg";
    import winter from "$lib/assets/icons/winter.svg";
    import fall from "$lib/assets/icons/fall.svg";
    import spring from "$lib/assets/icons/spring.svg";
    import tea from "$lib/assets/icons/tea.svg";
    import home from "$lib/assets/icons/home.svg";
    import hearth from "$lib/assets/icons/hearth.svg";

    const currentSeason = getCurrentSeason(winter, spring, summer, fall);
    const seasonIndex = getSeasonIndex();
    const year = new Date().getFullYear();

    $: loggedIn = pb.authStore.isValid;

    const pb = new PocketBase("https://dev.opentrust.it/");

    let seasonalAnime = [] as any[];
    let followedAnime = [] as any[];

    let modalAnimeTitle = "";
    let modalAnimeDescription = "";
    let modalAnimeImage = "";

    onMount(async () => {
        const seasonYearResult = await pb
            .collection("mau_seasonal")
            .getFullList({
                filter: `season = ${seasonIndex} && year = ${year}`,
            });
        seasonalAnime = seasonYearResult;
        // console.log(seasonYearResult);
        let toCheck = [];
        for (const anime of seasonalAnime) {
            toCheck.push(anime.mal_id);
        }
        const followedAnimeResult = await pb
            .collection("mau_follows")
            .getFullList({
                filter: `year = ${year} && season = ${seasonIndex} && user_id = '${pb.authStore.model?.id}'`,
            });
        followedAnime = followedAnimeResult;
    });

    function selectAnimeForModal(anime : string) {
        console.log(anime);
    }

    function isAnimeFollowed(anime: any) {
        // return true;
        return followedAnime.some((a) => a.mal_id === anime.mal_id);
    }

    async function getAnimeFromMalId(mal_id: string) {
        return await pb.collection("mau_anime")
            .getFirstListItem(`mal_id = ${mal_id}`);
    }

    function followAnime(anime: any) {
        if (isAnimeFollowed(anime)) {
            followedAnime = followedAnime.filter(
                (a) => a.mal_id !== anime.mal_id
            );
            // get from db
            pb.collection("mau_follows")
                .getList(1, 1, {
                    filter: `mal_id = '${anime.mal_id}' && user_id = '${pb.authStore.model?.id}'`,
                })
                .then((result) => {
                    if (result.items.length > 0) {
                        pb.collection("mau_follows").delete(result.items[0].id);
                    }
                });
            return;
        } else {
            followedAnime = [...followedAnime, anime];
            // save to db
            const toCreate = {
                mal_id: anime.mal_id,
                user_id: pb.authStore.model?.id,
                year: year,
                season: seasonIndex,
            };
            pb.collection("mau_follows").create(toCreate);
        }
    }

    async function openModal(anime: any) {
        // const animeData = await getAnimeFromMalId(anime.mal_id);
        modalAnimeDescription = anime.plot;
        modalAnimeTitle = anime.title;
        modalAnimeImage = anime.img;
        // @ts-ignore
        my_modal_2.showModal();
    }
</script>

<div class="flex justify-center align-middle mb-10">
    <ul
        class="menu bg-base-200 menu-horizontal rounded-box tabs tabs-boxed gap-5 items-center"
    >
        <li class="tab tab-active h-auto p-0">
            <a href="{base}/seasonal">
                <svg class="w-5 h-5">
                    <use href="{currentSeason}#season-img" />
                </svg>
                <div class="hidden sm:block">Seasonal</div>
            </a>
        </li>
        <li class="tab h-auto p-0">
            <a href="{base}/">
                <svg class="w-5 h-5">
                    <use href="{home}#home-img" />
                </svg>

                <div class="hidden sm:block">
                    Latest
                    <!-- <span class="badge badge-sm">99+</span> -->
                </div>
            </a>
        </li>
        <li class="tab h-auto p-0">
            <a href="{base}/followed">
                <svg class="w-5 h-5">
                    <use href="{tea}#tea-img" />
                </svg>
                <div class="hidden sm:block">Followed</div>
            </a>
        </li>
    </ul>
</div>

{#if loggedIn}
    <div class="flex flex-wrap justify-center gap-8 md:gap-10 mb-10">
        {#if seasonalAnime}
            {#each seasonalAnime as anime}
                <div
                    class="indicator {followedAnime.some(
                        (a) => a.mal_id === anime.mal_id
                    )
                        ? ''
                        : 'opacity-80'}"
                    on:click={() => openModal(anime)}
                    on:keydown={() => {}}
                    on:keyup={() => {}}
                    role="button"
                    tabindex="0"

                >
                    <span class="indicator-item indicator-end">
                        <button
                            class="btn btn-circle"
                            on:click={() => followAnime(anime)}
                        >
                            <svg
                                class="w-6 h-6 {followedAnime.some(
                                    (a) => a.mal_id === anime.mal_id
                                )
                                    ? 'fill-red-600'
                                    : 'stroke-base-content fill-none'}"
                            >
                                <use href="{hearth}#hearth" />
                            </svg>
                        </button>
                    </span>
                    <div
                        class="card w-36 md:w-52 bg-base-100 shadow-xl"
                    >
                        <figure>
                            <img
                                class="w-full h-48 md:h-72 object-cover"
                                src={anime.img}
                                alt={anime.title}
                            />
                        </figure>
                        <div class="card-body">
                            <p
                                class="break-words truncate md:overflow-auto md:whitespace-normal overflow-auto"
                            >
                                {anime.title}
                            </p>
                        </div>
                    </div>
                </div>
            {/each}
            <dialog id="my_modal_2" class="modal">
                <div class="modal-box p-0">
                    <div class="card w-full bg-base-100 shadow-xl image-full h-[60vh]">
                        <figure>
                            <img
                                src="{modalAnimeImage}"
                                alt="Shoes"
                                class="w-full"
                            />
                        </figure>
                        <div class="card-body">
                            <h2 class="card-title">{modalAnimeTitle}</h2>
                            <p>
                                {modalAnimeDescription}
                            </p>
                        </div>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        {:else}
            <span class="loading loading-spinner loading-lg" />
        {/if}
    </div>
{:else}
    <!-- log in button -->
    <div class="flex justify-center align-middle mb-10">
        <button
            class="btn btn-primary"
            on:click={async () => {
                await pb
                    .collection("users")
                    .authWithOAuth2({ provider: "github" });
                if (pb.authStore.isValid) {
                    await saveUserData(pb);
                    window.location.href = `${base}/seasonal`;
                }
                // console.log(pb.authStore);
                window.location.href = `${base}/seasonal`;
            }}
        >
            Log in
        </button>
    </div>
{/if}
