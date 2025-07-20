import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  try {
    let sql = `SELECT users.id as id, 
    users.name, 
    users.email, 
    user_profile.phone, 
    user_profile.address,
    batches.name as batch_name
    FROM students
    JOIN user_profile ON students.userid = user_profile.userid
    JOIN batches ON students.batchid = batches.id
    JOIN users ON students.userid = users.id
    `;
    let params: string[] = [];

    if (q) {
      sql += ' WHERE users.name LIKE ? OR users.email LIKE ?';
      params = [`%${q}%`, `%${q}%`];
    }

    const [rows] = await pool.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 