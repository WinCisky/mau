<script lang="ts">
    import { base } from "$app/paths";
    import { getCurrentSeason } from "$lib";    

    import summer from '$lib/assets/icons/summer.svg'
    import winter from '$lib/assets/icons/winter.svg'
    import fall from '$lib/assets/icons/fall.svg'
    import spring from '$lib/assets/icons/spring.svg'
    import tea from '$lib/assets/icons/tea.svg'
    import home from "$lib/assets/icons/home.svg";

    const currentSeason = getCurrentSeason(winter, spring, summer, fall);
</script>

<div class="flex justify-center align-middle mb-10">
    <ul class="menu bg-base-200 sm:menu-horizontal rounded-box tabs tabs-boxed gap-5 items-center">
        <li class="tab h-auto p-0">
          <a href="{base}/seasonal">
            <svg class="w-5 h-5">
                <use href="{currentSeason}#season-img"></use>
             </svg>
            Seasonal
          </a>
        </li>
        <li class="tab h-auto p-0">
            <a href="{base}/">
                <svg class="w-5 h-5">
                    <use href="{home}#home-img" />
                </svg>
                Latest
                <!-- <span class="badge badge-sm">99+</span> -->
            </a>
        </li>
        <li class="tab tab-active h-auto p-0">
          <a href="{base}/followed">
            <svg class="w-5 h-5">
                <use href="{tea}#tea-img"></use>
             </svg>
            Followed
          </a>
        </li>
      </ul>
</div>