import SearchPageClient from './SearchPageClient';

export const metadata = {
  robots: { index: false },
};

export default function SearchPage() {
  return <SearchPageClient />;
}
