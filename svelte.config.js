// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from "path";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Enable Svelte 5 runes
  compilerOptions: {
    runes: true
  },
  
  // Preprocess for TypeScript support
  preprocess: vitePreprocess(),
  
  kit: {
    adapter: adapter({
      fallback: "index.html",
    }),
    alias: {
      $lib: path.resolve("./src/lib"),
      $components: path.resolve("./src/lib/components")
    }
  },
};

export default config;
