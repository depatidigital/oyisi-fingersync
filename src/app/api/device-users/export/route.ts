import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/device-users/export: Export all mapped device users as JSON
export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT m.device_user_id, m.fingerprint_data, m.user_id, u.name, up.phone
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