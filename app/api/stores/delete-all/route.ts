import { supabaseServer } from '@/lib/supabase/server';

export async function DELETE(req: Request) {
    try {
        const supabase = supabaseServer();

        // Delete all stores from the database
        const { error, count } = await supabase
            .from('stores')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)

        if (error) {
            console.error('Error deleting all stores:', error);
            return new Response(
                JSON.stringify({ success: false, error: error.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, count: count || 0 }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Unexpected error deleting all stores:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
