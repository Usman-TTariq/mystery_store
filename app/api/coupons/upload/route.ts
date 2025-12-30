// Server-side coupon logo upload route using Supabase Storage

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, contentType, base64 } = body || {};

    console.log('📤 Coupon logo upload request received');

    if (!base64 || !fileName) {
      const error = { success: false, error: 'Missing file data' };
      console.error('❌ Missing file data');
      return new Response(JSON.stringify(error), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check Supabase configuration
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 Supabase Configuration Check:');
    console.log(`  - NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✅ Set' : '❌ Not set'}`);
    console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${hasSupabaseKey ? '✅ Set' : '❌ Not set'}`);

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.error('❌ Supabase not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
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
      const filePath = `coupon-logos/${Date.now()}_${safeName}`;

      console.log('📤 Uploading file to Supabase Storage:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('coupon-logos')
        .upload(filePath, buffer, {
          contentType: contentType || 'image/svg+xml',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Supabase Storage upload failed:', uploadError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Upload failed: ${uploadError.message}` 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('coupon-logos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('✅ Upload successful! URL:', publicUrl);

      return new Response(
        JSON.stringify({ 
          success: true, 
          logoUrl: publicUrl, 
          storage: 'supabase' 
        }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (err) {
      console.error('❌ Supabase upload error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Upload error: ${errorMessage}` 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (err) {
    console.error('Unexpected error in upload route:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Upload route error: ${errorMessage}` 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
