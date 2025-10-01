import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database' // Your SQL wrapper

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId)

    const parents = await sql`
      SELECT id, user_id, cnic, phone, address
      FROM parents 
      WHERE user_id = ${userId}
      LIMIT 1
    `

    if (parents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: parents[0]
    })

  } catch (error) {
    console.error('Get parent by user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parent record' },
      { status: 500 }
    )
  }
}