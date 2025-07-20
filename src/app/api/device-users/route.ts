import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/device-users: List all device user mappings
export async function GET() {
  try {
    const [rows] = await pool.execute(`
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
      ORDER BY m.device_user_id ASC
    `);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/device-users/import: Import device user data
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format. Expected an array.' }, { status: 400 });
    }

    for (const item of data) {
      if (!item.device_user_id) continue;
      await pool.execute(
        `INSERT INTO device_user_mapping (device_user_id, fingerprint_data) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE fingerprint_data = VALUES(fingerprint_data)`,
        [item.device_user_id, item.fingerprint_data || null]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 
