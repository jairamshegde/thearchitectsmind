import { getCollection, type CollectionEntry } from 'astro:content';
import { byDateDesc, isVisible } from './content';

type Dated = 'writing' | 'notes' | 'projects';

/** Entries for a collection, newest first. Drafts are included only in `astro dev`. */
export async function published<C extends Dated>(name: C): Promise<CollectionEntry<C>[]> {
  const all = (await getCollection(name)) as CollectionEntry<C>[];
  return all.filter((e) => isVisible(e, import.meta.env.DEV)).sort(byDateDesc);
}
