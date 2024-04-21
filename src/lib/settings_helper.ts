import type PocketBase from "pocketbase";

function mergeWatchedVideos(
  localWatchedVideos: { [key: string]: number[] },
  remoteWatchedVideos: { [key: string]: number[] },
) {
  for (const [animeId, episodes] of Object.entries(remoteWatchedVideos)) {
    if (localWatchedVideos[animeId]) {
      for (const episode of episodes) {
        if (!localWatchedVideos[animeId].includes(episode)) {
          localWatchedVideos[animeId].push(episode);
        }
      }
    } else {
      localWatchedVideos[animeId] = episodes;
    }
  }

  return localWatchedVideos;
}

export async function updateUserSettings(pb: PocketBase) {
  if (!pb.authStore.isValid) return;
  if (typeof localStorage === "undefined") return;

  const userId = pb.authStore.model?.id;

  //get previous settings
  const userData = await pb.collection("mau_users").getList(1, 1, {
    filter: `user = '${userId}'`,
  });

  if (userData.items.length === 0) return;
  const user_settings = JSON.parse(
    localStorage.getItem("user_settings") ?? "{}",
  );

  await pb.collection("mau_users").update(userData.items[0].id, {
    "ona": user_settings.ona ?? true,
    "dub": user_settings.dub ?? true,
    "mirror": user_settings.mirror ?? false,
  });
}

export async function getUserWatchedVideos(pb: PocketBase, page: number = 1) {
  if (!pb.authStore.isValid) return [];
  const watched = await pb.collection("mau_history").getList(page, 8, {
    filter: `user = '${pb.authStore.model?.id}' && created > '${new Date(
      new Date().getTime() - 1000 * 60 * 60 * 24 * 30, // 30 days
    ).toISOString()}'`,
    sort: "-created",
    expand: "episode.anime",
  });

  return watched.items;
}

export function toggleUserPreference(
  pb: PocketBase,
  name: string,
  defaultValue: boolean = true,
) {
  const preference = localStorage.getItem("user_settings");
  const settings = JSON.parse(preference || "{}");
  if (name in settings) {
    settings[name] = !settings[name];
  } else {
    settings[name] = !defaultValue;
  }
  localStorage.setItem("user_settings", JSON.stringify(settings));

  //save user data
  updateUserSettings(pb);
}
