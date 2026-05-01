import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), basicSsl(), viteSingleFile()],
  base: './', // CRITICAL for GitHub Pages so assets are loaded relative to index.html
  server: {
    host: true,
  },
});
