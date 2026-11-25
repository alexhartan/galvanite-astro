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
      href: z.string().optional(),
      image: image(),
      imageAlt: z.string(),
      logo: image().optional(),
      stats: z.array(z.string()).min(1),
    }),
});

const benefits = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/benefits' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    summary: z.string(),
    art: z.enum([
      'strategy',
      'consistency',
      'build',
      'performance',
      'process',
      'tools',
    ]),
  }),
});

const engagements = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/engagements' }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    tier: z.enum(['standard', 'featured', 'premium']),
    audience: z.string(),
    pricePrefix: z.string().optional(),
    price: z.string(),
    duration: z.string(),
    features: z.array(z.string()),
  }),
});

const checks = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/checks' }),
  schema: z.object({
    order: z.number(),
    statement: z.string(),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/faqs' }),
  schema: z.object({
    order: z.number(),
    question: z.string(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/testimonials' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      order: z.number(),
      role: z.string(),
      quote: z.string(),
      photo: image(),
      caseStudyHref: z.string().optional(),
    }),
});

const clients = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/clients' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      order: z.number(),
      logo: image(),
      hidden: z.boolean().default(false),
    }),
});

export const collections = {
  caseStudies,
  benefits,
  engagements,
  checks,
  faqs,
  testimonials,
  clients,
};
