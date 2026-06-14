import Fuse from 'fuse.js';

interface SearchableItem {
  name: string;
  category: string;
  subcategory: string;
  description: string;
}

export type ItemSearchIndex<T extends SearchableItem> = Fuse<T>;

export function createItemSearchIndex<T extends SearchableItem>(items: T[]): ItemSearchIndex<T> {
  return new Fuse(items, {
    keys: ['name', 'category', 'subcategory', 'description'],
    includeScore: true,
    threshold: 0.4,
  });
}

export function searchItems<T extends SearchableItem>(
  index: ItemSearchIndex<T>,
  query: string
): T[] {
  if (query.length < 2) {
    return [];
  }

  return index.search(query).map((result) => result.item);
}
