import { z } from 'astro/zod';

/** Astro's `image()` helper from the collection schema context (tests pass `() => z.string()`). */
export type ImageFn<I extends z.ZodType = z.ZodType> = () => I;

/** The CMS writes '' or null for a cleared field. Treat both as "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

const date = z.coerce.date();
const tags = z.array(z.string().min(1)).min(1);
const flags = { featured: z.boolean().default(false), draft: z.boolean().default(false) };

export const writingSchema = <I extends z.ZodType>(image: ImageFn<I>) =>
  z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date,
    tags,
    updated: optional(z.coerce.date()),
    cover: optional(image()),
    ...flags,
  });

export const noteSchema = z.object({
  title: z.string().min(1),
  date,
  tags,
  description: optional(z.string()),
  draft: z.boolean().default(false),
});

export const projectSchema = <I extends z.ZodType>(image: ImageFn<I>) =>
  z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    stack: z.array(z.string().min(1)).min(1),
    date,
    links: optional(z.object({ repo: optional(z.url()), demo: optional(z.url()) })),
    role: optional(z.string()),
    timeline: optional(z.string()),
    problem: optional(z.string()),
    constraints: optional(z.string()),
    outcome: optional(z.string()),
    lessons: optional(z.string()),
    cover: optional(image()),
    ...flags,
  });

export const aboutSchema = z.object({
  title: z.string().min(1),
  intro: z.string().min(1),
  now: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).default([]),
});

export const settingsSchema = <I extends z.ZodType>(image: ImageFn<I>) =>
  z.object({
    heroHeadline: z.string().min(1),
    heroSub: z.string().min(1),
    heroNote: z.string().min(1),
    heroImage: optional(image()),
    footerStatement: z.string().min(1),
    footerSub: z.string().min(1),
    socials: z.array(
      z.object({
        label: z.string().min(1),
        url: z.url(),
        meta: optional(z.string()),
        note: optional(z.string()),
      }),
    ),
  });
