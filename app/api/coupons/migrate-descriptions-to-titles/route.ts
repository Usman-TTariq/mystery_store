import { migrateCouponDescriptionsToTitles } from '@/lib/server/migrateCouponDescriptionsToTitles';

export async function POST() {
  try {
    const result = await migrateCouponDescriptionsToTitles();
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('migrate-descriptions-to-titles error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed',
      },
      { status: 500 }
    );
  }
}
