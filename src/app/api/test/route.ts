import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    return NextResponse.json({ success: true, db: !!db });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message, 
      stack: error.stack 
    }, { status: 500 });
  }
}
