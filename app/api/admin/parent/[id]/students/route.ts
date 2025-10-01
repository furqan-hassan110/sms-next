import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database' // Your SQL wrapper

// GET /api/admin/parents/[id]/students - Get linked students
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const parentId = parseInt(params.id)

        const links = await sql`
      SELECT 
        ps.id,
        ps.student_id,
        ps.relationship,
        s.name as student_name,
        s.class as student_class,
        s.section,
        s.student_id as student_code
      FROM parent_student ps
      INNER JOIN students s ON ps.student_id = s.id
      WHERE ps.parent_id = ${parentId}
      ORDER BY s.name
    `

        return NextResponse.json({
            success: true,
            links: links
        })

    } catch (error) {
        console.error('Get parent students error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch student links' },
            { status: 500 }
        )
    }
}

// POST /api/admin/parents/[id]/students - Link student to parent
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const parentId = parseInt(params.id)
        console.log("parent ID", parentId)
        const { studentId, relationship } = await request.json()
        console.log(studentId, relationship);

        // Get the actual parent record using user_id
        const parents = await sql`
            SELECT id FROM parents WHERE user_id = ${parentId}
        `
        console.log("parent", parents)

        if (parents.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Parent not found' },
                { status: 404 }
            )
        }

        // ✅ Store the actual parent ID from the database
        const actualParentId = parents[0].id;

        // Check if student exists
        const students = await sql`
            SELECT id FROM students WHERE id = ${parseInt(studentId)}
        `
        console.log(students)

        if (students.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Student not found' },
                { status: 404 }
            )
        }

        // ✅ FIX: Use actualParentId instead of parentId
        const existingLinks = await sql`
            SELECT id FROM parent_student 
            WHERE parent_id = ${actualParentId} AND student_id = ${parseInt(studentId)}
        `

        if (existingLinks.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Student already linked to this parent' },
                { status: 400 }
            )
        }

        // ✅ FIX: Use actualParentId instead of parentId
        const result = await sql`
            INSERT INTO parent_student (parent_id, student_id, relationship, is_primary, created_at)
            VALUES (${actualParentId}, ${parseInt(studentId)}, ${relationship || 'parent'}, true, NOW())
            RETURNING id
        `

        // Get the created link with student details
        const newLink = await sql`
            SELECT 
                ps.id,
                ps.student_id,
                ps.relationship,
                s.name as student_name,
                s.class as student_class,
                s.section
            FROM parent_student ps
            INNER JOIN students s ON ps.student_id = s.id
            WHERE ps.id = ${result[0].id}
        `

        return NextResponse.json({
            success: true,
            message: 'Student linked successfully',
            link: newLink[0]
        })

    } catch (error) {
        console.error('Link student error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to link student' },
            { status: 500 }
        )
    }
}