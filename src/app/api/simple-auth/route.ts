import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({
        error: 'Username and password are required'
      }, { status: 400 })
    }

    // Simple test authentication (replace with real logic later)
    if (username === 'admin' && password === 'Admin123*') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'test-admin-id',
          username: 'admin',
          role: 'admin'
        },
        message: 'Login successful'
      })
    }

    if (username === 'agent1' && password === 'Agent123*') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'test-user-id',
          username: 'agent1',
          role: 'user'
        },
        message: 'Login successful'
      })
    }

    return NextResponse.json({
      error: 'Invalid credentials'
    }, { status: 401 })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}