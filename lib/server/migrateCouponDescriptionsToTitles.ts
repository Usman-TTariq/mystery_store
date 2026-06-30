import { supabaseServer } from '@/lib/supabase/server';

export async function migrateCouponDescriptionsToTitles(): Promise<{
  updated: number;
  skipped: number;
}> {
  const supabase = supabaseServer();
  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('id, store_name, title, description');

  if (error) throw error;

  let updated = 0;
  let skipped = 0;

  for (const row of coupons || []) {
    const description = String(row.description || '').trim();
    if (!description) {
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from('coupons')
      .update({
        store_name: description,
        title: description,
        description: '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updateError) {
      console.error(`Failed to migrate coupon ${row.id}:`, updateError);
      throw updateError;
    }

    updated += 1;
  }

  return { updated, skipped };
}
