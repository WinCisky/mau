import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";
import { defineConfig } from "vite";

const dev = process.argv.includes("dev");

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      // svelte-preprocess is kept for `<style global>` support
      preprocess: preprocess(),
      adapter: adapter({
        pages: "build",
        assets: "build",
        fallback: "404.html",
        precompress: true,
        strict: true,
      }),
      paths: {
        base: (dev ? "" : process.env.BASE_PATH) as "" | `/${string}` | undefined,
      },
    }),
  ],
});
