import { readFileSync, writeFileSync } from 'fs';

const storesCsv = readFileSync('data/stores-bulk-test-55.csv', 'utf8');
const storeLines = storesCsv.split(/\r?\n/).slice(1).filter(Boolean);

const stores = storeLines.map((line) => {
  const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) =>
    c.replace(/^"|"$/g, '').trim()
  );
  return { name: cols[0], url: cols[5] || 'https://example.com' };
});

const extraStores = [
  { name: 'Your Surprise', url: 'https://www.yoursurprise.com' },
  { name: 'Saniweb.de', url: 'https://www.saniweb.de' },
];

const allStores = [...extraStores, ...stores];

const header =
  'store_id,Store Name,couponType,code,title,description,discount,discountType,expiryDate,getCodeText,getDealText,isActive,isLatest,isPopular,maxUses,url';

const rows = [header];
let n = 0;

for (let i = 0; i < allStores.length; i++) {
  const store = allStores[i];
  const storeId = i + 1;
  const isDeal = i % 7 === 6;
  const code = isDeal ? '' : `BULKCPN-${String(++n).padStart(3, '0')}`;
  const discount = [10, 15, 20, 25, 30, 5, 0][i % 7];
  const discountType = i % 11 === 0 ? 'fixed' : 'percentage';
  const title = isDeal
    ? `${store.name} — Special Deal ${n}`
    : `${store.name} — ${discount}${discountType === 'fixed' ? '€ Off' : '% Off'}`;
  const description = isDeal
    ? `Exclusive deal at ${store.name}. Limited time offer.`
    : `Save ${discount}${discountType === 'fixed' ? '€' : '%'} at ${store.name} with this verified promo code.`;

  rows.push(
    [
      storeId,
      store.name,
      isDeal ? 'deal' : 'code',
      code,
      title,
      description,
      discount,
      discountType,
      '2026-12-31',
      isDeal ? '' : 'Get Code',
      isDeal ? 'Get Deal' : '',
      'true',
      i % 5 === 0 ? 'true' : 'false',
      i % 4 === 0 ? 'true' : 'false',
      100,
      store.url,
    ].join(',')
  );
}

// 2nd coupon for first 5 stores (priority test)
for (let i = 0; i < 5; i++) {
  const store = allStores[i];
  const code = `BULKCPN2-${String(i + 1).padStart(2, '0')}`;
  rows.push(
    [
      i + 1,
      store.name,
      'code',
      code,
      `${store.name} — Extra 10% Off`,
      `Second offer for ${store.name} bulk upload test.`,
      10,
      'percentage',
      '2026-06-30',
      'Copy Code',
      '',
      'true',
      'false',
      'false',
      50,
      store.url,
    ].join(',')
  );
}

// 1 invalid row (should skip) for upload summary test
rows.push(
  '99999,Nonexistent Store XYZ,code,SKIP-999,Should Skip,This row should be skipped,10,percentage,2026-12-31,Get Code,,true,false,false,100,https://example.com'
);

writeFileSync('data/coupons-bulk-test-62.csv', rows.join('\n') + '\n', 'utf8');
console.log(`Created data/coupons-bulk-test-62.csv with ${rows.length - 1} coupon rows`);
