import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7)
    const view = searchParams.get("view") || "site"
    const site = searchParams.get("site")
    const department = searchParams.get("department")

    const effectiveMonth = `${month}-01`

    let details: any[] = []

    if (view === "site") {
      // Aggregate by site
      details = await sql`
        WITH hierarchy_targets AS (
          SELECT 
            u.site,
            h.user_id as leader_id,
            h.direct_reports_count as target
          FROM tms_organizational_hierarchy h
          JOIN users u ON h.user_id = u.id
          WHERE h.effective_month = ${effectiveMonth}
          AND h.is_active = true
          AND h.direct_reports_count > 0
        ),
        evidence_realization AS (
          SELECT 
            u.site,
            e.leader_id,
            COUNT(DISTINCT e.subordinate_id) as realized_subordinates
          FROM tms_leadership_evidence e
          JOIN users u ON e.leader_id = u.id
          WHERE e.activity_month = ${effectiveMonth}
          AND e.is_deleted = false
          GROUP BY u.site, e.leader_id
        )
        SELECT 
          ht.site,
          SUM(ht.target) as target,
          COALESCE(SUM(er.realized_subordinates), 0) as realization,
          CASE 
            WHEN SUM(ht.target) > 0 THEN (COALESCE(SUM(er.realized_subordinates), 0)::decimal / SUM(ht.target)::decimal * 100)
            ELSE 0
          END as percentage
        FROM hierarchy_targets ht
        LEFT JOIN evidence_realization er ON ht.site = er.site AND ht.leader_id = er.leader_id
        GROUP BY ht.site
        ORDER BY ht.site
      `
    } else if (view === "department") {
      // Aggregate by department within a site
      details = await sql`
        WITH hierarchy_targets AS (
          SELECT 
            u.site,
            u.departemen as department,
            h.user_id as leader_id,
            h.direct_reports_count as target
          FROM tms_organizational_hierarchy h
          JOIN users u ON h.user_id = u.id
          WHERE h.effective_month = ${effectiveMonth}
          AND u.site = ${site}
          AND h.is_active = true
          AND h.direct_reports_count > 0
        ),
        evidence_realization AS (
          SELECT 
            u.site,
            u.departemen as department,
            e.leader_id,
            COUNT(DISTINCT e.subordinate_id) as realized_subordinates
          FROM tms_leadership_evidence e
          JOIN users u ON e.leader_id = u.id
          WHERE e.activity_month = ${effectiveMonth}
          AND u.site = ${site}
          AND e.is_deleted = false
          GROUP BY u.site, u.departemen, e.leader_id
        )
        SELECT 
          ht.site,
          ht.department,
          SUM(ht.target) as target,
          COALESCE(SUM(er.realized_subordinates), 0) as realization,
          CASE 
            WHEN SUM(ht.target) > 0 THEN (COALESCE(SUM(er.realized_subordinates), 0)::decimal / SUM(ht.target)::decimal * 100)
            ELSE 0
          END as percentage
        FROM hierarchy_targets ht
        LEFT JOIN evidence_realization er ON ht.site = er.site AND ht.department = er.department AND ht.leader_id = er.leader_id
        GROUP BY ht.site, ht.department
        ORDER BY ht.department
      `
    } else if (view === "individual") {
      // Individual leaders within department
      details = await sql`
        WITH hierarchy_targets AS (
          SELECT 
            u.site,
            u.departemen as department,
            h.user_id as leader_id,
            u.name as leader_name,
            h.direct_reports_count as target
          FROM tms_organizational_hierarchy h
          JOIN users u ON h.user_id = u.id
          WHERE h.effective_month = ${effectiveMonth}
          AND u.site = ${site}
          AND u.departemen = ${department}
          AND h.is_active = true
          AND h.direct_reports_count > 0
        ),
        evidence_realization AS (
          SELECT 
            e.leader_id,
            COUNT(DISTINCT e.subordinate_id) as realized_subordinates
          FROM tms_leadership_evidence e
          JOIN users u ON e.leader_id = u.id
          WHERE e.activity_month = ${effectiveMonth}
          AND u.site = ${site}
          AND u.departemen = ${department}
          AND e.is_deleted = false
          GROUP BY e.leader_id
        )
        SELECT 
          ht.site,
          ht.department,
          ht.leader_id,
          ht.leader_name,
          ht.target,
          COALESCE(er.realized_subordinates, 0) as realization,
          CASE 
            WHEN ht.target > 0 THEN (COALESCE(er.realized_subordinates, 0)::decimal / ht.target::decimal * 100)
            ELSE 0
          END as percentage
        FROM hierarchy_targets ht
        LEFT JOIN evidence_realization er ON ht.leader_id = er.leader_id
        ORDER BY ht.leader_name
      `
    }

    // Calculate summary
    const summary = {
      target: details.reduce((sum: number, item: any) => sum + Number(item.target), 0),
      realization: details.reduce((sum: number, item: any) => sum + Number(item.realization), 0),
      percentage: 0,
    }

    if (summary.target > 0) {
      summary.percentage = (summary.realization / summary.target) * 100
    }

    return NextResponse.json({
      summary,
      details,
    })
  } catch (error) {
    console.error("[v0] GET monitoring error:", error)
    return NextResponse.json({ error: "Gagal mengambil data monitoring" }, { status: 500 })
  }
}
