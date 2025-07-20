import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/device-users/map: Map a device_user_id to a user_id or unmap
export async function POST(request: NextRequest) {
  try {
    const { device_user_id, user_id } = await request.json();

    console.log('Map API called with:', { device_user_id, user_id });

    if (!device_user_id) {
      return NextResponse.json({ error: 'device_user_id is required.' }, { status: 400 });
    }

    if (user_id === null || user_id === undefined) {
      // Unmap: set user_id to NULL
      console.log('Unmapping device_user_id:', device_user_id);
      const [result] = await pool.execute(
        'UPDATE device_user_mapping SET user_id = NULL WHERE device_user_id = ?',
        [device_user_id]
      );
      console.log('Unmap result:', result);
    } else {
      // Map: insert or update
      console.log('Mapping device_user_id:', device_user_id, 'to user_id:', user_id);
      const [result] = await pool.execute(
        `INSERT INTO device_user_mapping (device_user_id, user_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [device_user_id, user_id]
      );
      console.log('Map result:', result);
    }
    const [data] = await pool.execute(`
      SELECT m.id,
      m.device_user_id, 
      m.fingerprint_data,
      m.user_id,
      u.name,
      up.phone,
      up.address
      FROM device_user_mapping m
      JOIN users u ON m.user_id = u.id
      JOIN user_profile up ON u.id = up.userid
      WHERE m.device_user_id = ?
    `, [device_user_id] );
    if(data && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({ success: true, data: data[0] });
    }
    return NextResponse.json({ success: false, data: null });
  } catch (err: any) {
    console.error('Map API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}