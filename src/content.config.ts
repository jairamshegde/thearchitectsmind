import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { aboutSchema, noteSchema, projectSchema, settingsSchema, writingSchema } from './lib/schemas';

/** One folder per entry: src/content/<dir>/<slug>/index.md, with its images beside it. */
const entryFolders = (dir: string) =>
  glob({
    pattern: '*/index.md',
    base: `./src/content/${dir}`,
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  });

export const collections = {
  writing: defineCollection({ loader: entryFolders('writing'), schema: ({ image }) => writingSchema(image) }),
  notes: defineCollection({ loader: entryFolders('notes'), schema: noteSchema }),
  projects: defineCollection({ loader: entryFolders('projects'), schema: ({ image }) => projectSchema(image) }),
  pages: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/pages' }), schema: aboutSchema }),
  settings: defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/settings' }), schema: settingsSchema }),
};
