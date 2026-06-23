import { createCategory, getCategories } from '@/lib/services/categoryService';
import { getCategoryEmoji } from '@/lib/utils/categoryIcon';

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

        const result = await createCategory(
            name,
            background_color || '#E5E7EB',
            undefined,
            icon_url || getCategoryEmoji(name)
        );

        if (result.success) {
            return new Response(
                JSON.stringify({ success: true, id: result.id }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const err = result.error;
        const errorMessage =
            typeof err === 'string'
                ? err
                : err && typeof err === 'object' && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : err instanceof Error
                    ? err.message
                    : 'Failed to create category';

        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
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
