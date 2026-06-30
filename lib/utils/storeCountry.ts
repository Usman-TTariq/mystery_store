const SLUG_COUNTRY_SUFFIX = /-(us|uk|fr|de|es|it|ca|au|nl|be|ch|at|ie|nz|in|br|mx|jp|kr|sg|ae|sa|pl|se|no|dk|fi|pt|cz|hu|ro|gr|tr|za)$/i;
const NAME_COUNTRY_SUFFIX = /\b(US|UK|FR|DE|ES|IT|CA|AU|NL|BE|CH|AT|IE|NZ|IN|BR|MX|JP|KR|SG|AE|SA|PL|SE|NO|DK|FI|PT|CZ|HU|RO|GR|TR|ZA)\b$/i;

/** Infer 2-letter country code from slug (e.g. cleva-fr) or store name (e.g. Cleva FR). */
export function inferCountryCode(slug?: string | null, name?: string | null): string | null {
  if (slug?.trim()) {
    const slugMatch = slug.trim().toLowerCase().match(SLUG_COUNTRY_SUFFIX);
    if (slugMatch) return slugMatch[1].toUpperCase();
  }

  if (name?.trim()) {
    const nameMatch = name.trim().match(NAME_COUNTRY_SUFFIX);
    if (nameMatch) return nameMatch[1].toUpperCase();
  }

  return null;
}
