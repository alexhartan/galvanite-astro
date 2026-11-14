import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const caseStudies = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      scope: z.array(z.string()),
      image: image(),
      imageAlt: z.string(),
      kpi: z.string(),
      kpiLabel: z.string(),
    }),
});

export const collections = { caseStudies };
