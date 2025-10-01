import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database' // Your SQL wrapper

// DELETE /api/admin/parents/[id]/students/[linkId] - Unlink student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    const parentId = parseInt(params.id)
    const linkId = parseInt(params.linkId)

    // Verify the link belongs to the parent
    const links = await sql`
      SELECT id FROM parent_student 
      WHERE id = ${linkId} AND parent_id = ${parentId}
    `

    if (links.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      )
    }

    await sql`
      DELETE FROM parent_student 
      WHERE id = ${linkId}
    `

    return NextResponse.json({
      success: true,
      message: 'Student unlinked successfully'
    })

  } catch (error) {
    console.error('Unlink student error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unlink student' },
      { status: 500 }
    )
  }
}