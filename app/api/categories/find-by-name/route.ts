import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { categoryName } = body;

        if (!categoryName || typeof categoryName !== 'string') {
            return new Response(
                JSON.stringify({ success: false, error: 'Category name is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const supabase = supabaseServer();

        // Search for category by name (case-insensitive)
        const { data, error } = await supabase
            .from('categories')
            .select('id, name')
            .ilike('name', categoryName.trim())
            .limit(1)
            .single();

        if (error || !data) {
            // Category not found
            return new Response(
                JSON.stringify({ success: true, categoryId: null, found: false }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, categoryId: data.id, found: true, name: data.name }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error finding category:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
