import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    service: 'AI Service Assistant',
    version: '1.0.0'
  })
}