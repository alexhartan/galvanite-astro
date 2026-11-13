import { writeFile } from 'node:fs/promises';
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const cameraDefault = {
  name: 'camera-default',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/__camera-default', (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end();
          return;
        }
        let body = '';
        request.on('data', (chunk) => (body += chunk));
        request.on('end', async () => {
          try {
            const file = new URL(
              './src/scripts/hero-camera.json',
              import.meta.url,
            );
            await writeFile(
              file,
              JSON.stringify(JSON.parse(body), null, 2) + '\n',
            );
            response.statusCode = 204;
          } catch {
            response.statusCode = 400;
          }
          response.end();
        });
      });
    },
  },
};

export default defineConfig({
  site: 'https://www.galvanite.com',
  output: 'static',
  trailingSlash: 'always',
  prefetch: { defaultStrategy: 'hover' },
  integrations: [
    sitemap({ filter: (page) => !page.includes('/lab/') }),
    cameraDefault,
  ],
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'DM Sans',
      cssVariable: '--font-dm-sans',
      weights: ['100 1000'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
  ],
});
