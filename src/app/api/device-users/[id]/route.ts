import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// DELETE /api/device-users/[id]: Delete a device user mapping
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Delete the mapping
    const [result] = await pool.execute(
      'DELETE FROM device_user_mapping WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}