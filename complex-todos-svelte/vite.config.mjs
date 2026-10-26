import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
  plugins: [
    svelte(),
    meteor({ clientEntry: 'client/main.js' }),
  ],
  server: { port: Number(process.env.VITE_PORT || 5173), strictPort: true },
});
