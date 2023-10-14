<script lang="ts">
    import { base } from "$app/paths";
    import { getCurrentSeason } from "$lib";    

    import summer from '$lib/assets/icons/summer.svg'
    import winter from '$lib/assets/icons/winter.svg'
    import autumn from '$lib/assets/icons/autumn.svg'
    import spring from '$lib/assets/icons/spring.svg'
    import tea from '$lib/assets/icons/tea.svg'

    const currentSeason = getCurrentSeason(winter, spring, summer, autumn);
</script>

<div class="flex justify-center align-middle mb-10">
    <ul class="menu bg-base-200 lg:menu-horizontal rounded-box tabs tabs-boxed gap-5">
        <li class="tab h-auto p-0">
          <a href="{base}/">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Latest
            <!-- <span class="badge badge-sm">99+</span> -->
          </a>
        </li>
        <li class="tab h-auto p-0">
          <a href="{base}/seasonal">
            <svg class="w-5 h-5">
                <use href="{currentSeason}#season-img"></use>
             </svg>
            Seasonal
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