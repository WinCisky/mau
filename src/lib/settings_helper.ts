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

export async function getUserWatchedVideos(pb: PocketBase, episodes: any[]) {
  if (!pb.authStore.isValid) return [];
  // const quotedEpisodes = episodes.map((e) => `'${e}'`) ?? [];
  const watched = await pb.collection("mau_history").getList(1, 1, {
    filter: `user = '${pb.authStore.model?.id}'`,
  });

  // only return array of ids of watched episodes
  const episodesWatched = [];
  for (const episodeWatched of watched.items) {
    episodesWatched.push(episodeWatched.id);
  }
  return episodesWatched;
}

export async function saveUserData(pb: PocketBase): Promise<boolean> {
  if (!pb.authStore.isValid) return false;
  if (typeof localStorage === "undefined") return false;

  let synched = (localStorage.getItem("synched") ?? "false") == "true";
  let synchedDate = new Date(
    localStorage.getItem("synchedDate") ?? "1970-01-01T00:00:00.000Z",
  );
  // 1 minute
  if (synched && (new Date().getTime() - synchedDate.getTime()) < 1000 * 60) {
    return false;
  }

  const userId = pb.authStore.model?.id;
  const watchedVideos = JSON.parse(
    localStorage.getItem("watchedVideos") ?? "{}",
  );
  const volume = parseFloat(localStorage.getItem("volume") || "1");

  //get previous settings if any
  const userData = await pb.collection("mau_users").getList(1, 1, {
    filter: `user = '${userId}'`,
  });

  if (userData.items.length > 0) {
    // use previous settings
    localStorage.setItem(
      "user_settings",
      JSON.stringify({
        "ona": userData.items[0].ona,
        "dub": userData.items[0].dub,
        "mirror": userData.items[0].mirror,
      }),
    );
    // merge watched videos
    const mergedWatchedVideos = mergeWatchedVideos(
      userData.items[0].watched,
      watchedVideos,
    );
    // update watched videos
    await pb.collection("mau_users").update(userData.items[0].id, {
      "watched": mergedWatchedVideos,
    });
    // update local storage
    localStorage.setItem("watchedVideos", JSON.stringify(mergedWatchedVideos));
    // update volume
    localStorage.setItem("volume", userData.items[0].volume);
    // update user settings
    localStorage.setItem(
      "user_settings",
      JSON.stringify({
        "ona": userData.items[0].ona,
        "dub": userData.items[0].dub,
        "mirror": userData.items[0].mirror,
      }),
    );
  } else {
    const user_settings = JSON.parse(
      localStorage.getItem("user_settings") ?? "{}",
    );
    const data = {
      "user": userId,
      "ona": user_settings.ona ?? true,
      "dub": user_settings.dub ?? true,
      "mirror": user_settings.mirror ?? false,
      "watched": watchedVideos,
      "volume": volume,
    };

    await pb.collection("mau_users").create(data);
  }

  localStorage.setItem("synched", "true");
  localStorage.setItem("synchedDate", new Date().toISOString());
  return true;
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
