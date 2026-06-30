export function extractDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function getStoreDomain(
  websiteUrl?: string | null,
  trackingLink?: string | null,
  storeName?: string,
  slug?: string | null
): string | null {
  const fromUrl = extractDomain(websiteUrl) || extractDomain(trackingLink);
  if (fromUrl && !isAffiliateDomain(fromUrl)) return fromUrl;

  if (slug?.trim()) {
    const s = slug.trim().toLowerCase();
    if (s.includes('.')) return s.replace(/^www\./, '');
    const countryMatch = s.match(/^(.+)-([a-z]{2})$/);
    if (countryMatch) return `${countryMatch[1]}.${countryMatch[2]}`;
    return `${s.replace(/-/g, '')}.com`;
  }

  return guessDomainFromName(storeName);
}

function isAffiliateDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return (
    d.includes('linkhexa') ||
    d.includes('redirect') ||
    d.includes('track') ||
    d.includes('affiliate') ||
    d.includes('clk.') ||
    d.includes('go.')
  );
}

function guessDomainFromName(name?: string): string | null {
  if (!name) return null;
  const known: Record<string, string> = {
    amazon: 'amazon.com',
    nike: 'nike.com',
    "mcdonald's": 'mcdonalds.com',
    mcdonalds: 'mcdonalds.com',
    'booking.com': 'booking.com',
    booking: 'booking.com',
    'best buy': 'bestbuy.com',
    'h&m': 'hm.com',
    'uber eats': 'ubereats.com',
    expedia: 'expedia.com',
    target: 'target.com',
    walmart: 'walmart.com',
    adidas: 'adidas.com',
    apple: 'apple.com',
    costco: 'costco.com',
    ikea: 'ikea.com',
    ulta: 'ulta.com',
    wayfair: 'wayfair.com',
    chewy: 'chewy.com',
    sephora: 'sephora.com',
    doordash: 'doordash.com',
    airbnb: 'airbnb.com',
    zara: 'zara.com',
    shein: 'shein.com',
  };
  const key = name.toLowerCase().trim();
  if (known[key]) return known[key];
  if (key.includes('.')) return key.replace(/\s+/g, '');

  return null;
}

function googleFavicon(domain: string, size = 128): string {
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=${size}`;
}

function avatarFallback(name: string): string {
  const label = encodeURIComponent(name.trim().slice(0, 2).toUpperCase() || '?');
  return `https://ui-avatars.com/api/?name=${label}&background=0B453C&color=ffffff&bold=true&size=128`;
}

/** Ordered fallback URLs — component tries each on error */
export function getStoreLogoCandidates(
  logoUrl?: string | null,
  websiteUrl?: string | null,
  trackingLink?: string | null,
  storeName?: string,
  slug?: string | null
): string[] {
  const domain = getStoreDomain(websiteUrl, trackingLink, storeName, slug);
  const candidates: string[] = [];
  const raw = logoUrl?.trim();
  const isFavicon =
    !!raw &&
    (raw.includes('google.com/s2/favicons') ||
      raw.includes('gstatic.com/faviconV2') ||
      raw.includes('duckduckgo.com/ip3'));

  if (raw && !isFavicon) candidates.push(raw);
  if (domain) {
    candidates.push(googleFavicon(domain, 128));
    candidates.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }
  if (raw && isFavicon) candidates.push(raw);
  if (storeName) candidates.push(avatarFallback(storeName));

  return [...new Set(candidates)];
}
