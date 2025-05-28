import { NextResponse } from 'next/server';
import points from '@/data/random_points.json';

export async function GET() {
  return NextResponse.json(points);
} 