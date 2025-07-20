import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  try {
    let sql = 'SELECT users.id as id, users.name, users.email FROM users';
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