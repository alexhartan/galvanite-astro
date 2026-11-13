import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const git = promisify(execFile);
const cameraFile = './src/scripts/hero-camera.json';

const publishCamera = async () => {
  const { stdout } = await git('git', ['branch', '--show-current']);
  if (stdout.trim() !== 'main') return false;
  await git('git', ['add', cameraFile]);
  const { stdout: staged } = await git('git', [
    'diff',
    '--cached',
    '--name-only',
    '--',
    cameraFile,
  ]);
  if (!staged.trim()) return true;
  await git('git', [
    'commit',
    '-m',
    'Update hero animation default',
    '--',
    cameraFile,
  ]);
  await git('git', ['push', 'origin', 'main']);
  return true;
};

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
            const file = new URL(cameraFile, import.meta.url);
            await writeFile(
              file,
              JSON.stringify(JSON.parse(body), null, 2) + '\n',
            );
            response.statusCode = (await publishCamera()) ? 204 : 202;
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
  site: process.env.SITE_URL ?? 'https://www.galvanite.com',
  base: process.env.SITE_BASE ?? '/',
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
