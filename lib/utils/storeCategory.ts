export type StoreCategoryInput = {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
};

type CategoryRule = {
  category: string;
  patterns: RegExp[];
};

/** Store-specific and keyword rules — first match wins. */
const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'home and garden',
    patterns: [
      /\bshedstore\b/i,
      /\bbuy\s*sheds\b/i,
      /\bsheds?\s*direct\b/i,
      /\bplots?\s*discount\b/i,
      /\bcleva\b/i,
      /\blawnmaster\b/i,
      /\bvacmaster\b/i,
      /\bshed\b/i,
      /\bplot\b/i,
      /\bgarden\b/i,
      /\blawn\b/i,
      /\bmower\b/i,
      /\bgreenhouse\b/i,
      /\bpatio\b/i,
      /\boutdoor\s+power\b/i,
    ],
  },
  {
    category: 'automotive',
    patterns: [
      /\bembossed\s*graphics\b/i,
      /\blicense\s*plate\b/i,
      /\b4knines\b/i,
      /\btyres?\b/i,
      /\btires?\b/i,
      /\bautomotive\b/i,
      /\bauto\s+parts\b/i,
      /\bcar\s+accessories\b/i,
    ],
  },
  {
    category: 'food',
    patterns: [
      /\bregal\s*fish\b/i,
      /\bseafood\b/i,
      /\bfish\b/i,
      /\bgrocery\b/i,
      /\bgruns\b/i,
      /\bnutrition\b/i,
      /\bsnack\b/i,
      /\bmeal\b/i,
    ],
  },
  {
    category: 'fashion',
    patterns: [
      /\bmac\s*alyster\b/i,
      /\bmacalyster\b/i,
      /\bsunshine\s*tienda\b/i,
      /\bsunshinetienda\b/i,
      /\bhandbag\b/i,
      /\bmaroquinerie\b/i,
      /\bapparel\b/i,
      /\bclothing\b/i,
      /\bfashion\b/i,
      /\bdress\b/i,
      /\bsarong\b/i,
      /\bbeachwear\b/i,
    ],
  },
  {
    category: 'footwear',
    patterns: [/\befootwear\b/i, /\bfootwear\b/i, /\bshoe\b/i, /\bsneaker\b/i],
  },
  {
    category: 'home',
    patterns: [
      /\bstarlight\s*beds\b/i,
      /\bbeds?\b/i,
      /\bmattress\b/i,
      /\bdecor\b/i,
      /\bfurniture\b/i,
      /\bkitchen\b/i,
      /\bhome\b/i,
    ],
  },
  {
    category: 'gifts',
    patterns: [/\bbloomz\b/i, /\bflorist\b/i, /\bflower\b/i, /\bbloom\b/i, /\bgift\b/i],
  },
  {
    category: 'electronics',
    patterns: [/\bdreame\b/i, /\bbinoid\b/i, /\belectronics\b/i, /\bappliance\b/i],
  },
  {
    category: 'health',
    patterns: [/\bhealth\b/i, /\bwellness\b/i, /\bsupplement\b/i],
  },
  {
    category: 'beauty',
    patterns: [/\bbeauty\b/i, /\bcosmetic\b/i, /\bskincare\b/i],
  },
  {
    category: 'pets',
    patterns: [/\bpet\b/i, /\bdog\b/i, /\bcat\b/i],
  },
  {
    category: 'travel',
    patterns: [/\btravel\b/i, /\bflight\b/i, /\bhotel\b/i],
  },
  {
    category: 'gaming',
    patterns: [/\bgaming\b/i, /\bgame\b/i, /\bconsole\b/i],
  },
  {
    category: 'sports and outdoor',
    patterns: [/\bsports\b/i, /\boutdoor\b/i, /\bhiking\b/i, /\bsuunto\b/i],
  },
  {
    category: 'baby',
    patterns: [/\bbaby\b/i, /\bnursery\b/i],
  },
  {
    category: 'toys',
    patterns: [/\btoy\b/i, /\btoys\b/i],
  },
  {
    category: 'books',
    patterns: [/\bbook\b/i, /\bbooks\b/i],
  },
  {
    category: 'office',
    patterns: [/\boffice\b/i, /\bstationery\b/i],
  },
  {
    category: 'education',
    patterns: [/\beducation\b/i, /\bcourse\b/i, /\blearning\b/i],
  },
  {
    category: 'kids',
    patterns: [/\bkids\b/i, /\bchildren\b/i],
  },
  {
    category: 'hobbies',
    patterns: [/\bcraft\b/i, /\bhobby\b/i, /\bknit\b/i],
  },
  {
    category: 'technology',
    patterns: [/\btechnology\b/i, /\bsoftware\b/i, /\blaptop\b/i],
  },
];

function buildHaystack(input: StoreCategoryInput): string {
  return [
    input.name,
    input.slug?.replace(/-/g, ' '),
    input.description,
    input.websiteUrl,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Infer category name from store fields. Returns lowercase name matching DB categories. */
export function inferStoreCategoryName(input: StoreCategoryInput): string | null {
  const haystack = buildHaystack(input);
  if (!haystack.trim()) return null;

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule.category;
    }
  }

  return null;
}

export function resolveStoreCategoryId(
  input: StoreCategoryInput,
  categoriesByName: Map<string, string>
): string | null {
  const inferred = inferStoreCategoryName(input);
  if (!inferred) return null;
  return categoriesByName.get(inferred.toLowerCase().trim()) ?? null;
}

export function buildCategoryNameMap(
  categories: Array<{ id: string; name: string }>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const cat of categories) {
    map.set(cat.name.toLowerCase().trim(), cat.id);
  }
  return map;
}
