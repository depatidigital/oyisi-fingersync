import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/device-users/map: Map a device_user_id to a user_id or unmap
export async function POST(request: NextRequest) {
  try {
    const { device_user_id, user_id } = await request.json();
    
    if (!device_user_id) {
      return NextResponse.json({ error: 'device_user_id is required.' }, { status: 400 });
    }
    
    if (user_id === null || user_id === undefined) {
      // Unmap: set user_id to NULL
      await pool.execute(
        'UPDATE device_user_mapping SET user_id = NULL WHERE device_user_id = ?',
        [device_user_id]
      );
    } else {
      // Map: insert or update
      await pool.execute(
        `INSERT INTO device_user_mapping (device_user_id, user_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [device_user_id, user_id]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 