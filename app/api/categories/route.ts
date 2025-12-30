import { createCategory, getCategories } from '@/lib/services/categoryService';

export async function GET() {
    try {
        const categories = await getCategories();

        return new Response(
            JSON.stringify({ success: true, categories }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error fetching categories:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, icon_url, background_color } = body;

        if (!name) {
            return new Response(
                JSON.stringify({ success: false, error: 'Category name is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const result = await createCategory({
            name,
            icon_url: icon_url || '📦',
            background_color: background_color || '#E5E7EB',
        });

        if (result.success) {
            return new Response(
                JSON.stringify({ success: true, id: result.id }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        } else {
            return new Response(
                JSON.stringify({ success: false, error: result.error }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    } catch (error) {
        console.error('Error creating category:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
