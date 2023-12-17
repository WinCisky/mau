import { writable, type Writable } from "svelte/store";

export const selectedTheme : Writable<string> = writable("default");
export const watched : Writable<string []> = writable([]);
export const history : Writable<any []> = writable([]);
