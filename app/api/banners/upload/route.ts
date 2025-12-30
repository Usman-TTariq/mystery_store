// Server-side banner upload route using Supabase Storage and Database

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, fileName, contentType, base64, collection, layoutPosition } = body || {};

    if (!base64 || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing file data' }), 
        { status: 400 }
      );
    }

    // Check Supabase configuration
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' 
        }),
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64');
    const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const targetCollection = collection || 'banners';
    const filePath = `${targetCollection}/${Date.now()}_${safeName}`;

    console.log('📤 Uploading banner to Supabase Storage:', filePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, buffer, {
        contentType: contentType || 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Supabase Storage upload failed:', uploadError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Upload failed: ${uploadError.message}` 
        }),
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('✅ Banner uploaded successfully! URL:', publicUrl);

    // Save banner metadata to Supabase database
    const bannerData: any = {
      title: title || '',
      image_url: publicUrl,
      position: targetCollection === 'banners' ? 'home' : targetCollection,
      active: true,
      order_index: layoutPosition || 0,
    };

    const { data: bannerRecord, error: dbError } = await supabase
      .from('banners')
      .insert(bannerData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Failed to save banner metadata:', dbError);
      // Still return success since file was uploaded
      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: publicUrl, 
          stored: 'supabase',
          warning: 'File uploaded but metadata save failed'
        }), 
        { status: 200 }
      );
    }

    console.log('✅ Banner metadata saved:', bannerRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: bannerRecord.id, 
        imageUrl: publicUrl, 
        stored: 'supabase' 
      }), 
      { status: 200 }
    );
  } catch (err) {
    console.error('Server upload error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err instanceof Error ? err.message : String(err) 
      }), 
      { status: 500 }
    );
  }
}
