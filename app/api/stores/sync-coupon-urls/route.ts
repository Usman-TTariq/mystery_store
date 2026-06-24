import { syncStoreCouponUrls } from '@/lib/server/syncStoreCouponUrls';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const storeUuid = body?.storeUuid ? String(body.storeUuid) : undefined;
    const storeName = body?.storeName ? String(body.storeName) : undefined;
    const trackingLink =
      body?.trackingLink !== undefined ? (body.trackingLink as string | null) : undefined;

    if (!storeUuid && !storeName) {
      return Response.json(
        { success: false, error: 'storeUuid or storeName is required' },
        { status: 400 }
      );
    }

    const updatedCount = await syncStoreCouponUrls({
      storeUuid,
      storeName,
      trackingLink,
    });

    return Response.json({ success: true, updatedCount });
  } catch (error) {
    console.error('sync-coupon-urls API error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync coupon URLs',
      },
      { status: 500 }
    );
  }
}
