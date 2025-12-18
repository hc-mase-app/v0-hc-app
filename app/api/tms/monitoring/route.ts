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

    console.log("[v0] Monitoring query:", { month, effectiveMonth, view, site, department })

    let details: any[] = []

    if (view === "site") {
      details = await sql`
        WITH hierarchy_targets AS (
          SELECT 
            m.site,
            m.id as leader_id,
            COUNT(*) as target
          FROM karyawan k
          JOIN karyawan m ON k.manager_id = m.id
          WHERE k.manager_id IS NOT NULL
          AND (
            m.level != 'Manager' 
            OR (m.level = 'Manager' AND m.site IN ('Head Office', 'BSF'))
          )
          GROUP BY m.site, m.id
        ),
        evidence_realization AS (
          SELECT 
            k.site,
            e.leader_id,
            COUNT(DISTINCT e.subordinate_id) as realized_subordinates
          FROM tms_leadership_evidence e
          JOIN karyawan k ON e.leader_id = k.id
          WHERE e.activity_month = ${effectiveMonth}
          AND e.status = 'ACTIVE'
          GROUP BY k.site, e.leader_id
        )
        SELECT 
          ht.site,
          NULL::varchar as department,
          NULL::uuid as leader_id,
          NULL::varchar as leader_name,
          SUM(ht.target)::integer as target,
          COALESCE(SUM(er.realized_subordinates), 0)::integer as realization,
          CASE 
            WHEN SUM(ht.target) > 0 THEN (COALESCE(SUM(er.realized_subordinates), 0)::decimal / SUM(ht.target)::decimal * 100)
            ELSE 0
          END::numeric as percentage
        FROM hierarchy_targets ht
        LEFT JOIN evidence_realization er ON ht.site = er.site AND ht.leader_id = er.leader_id
        GROUP BY ht.site
        ORDER BY ht.site
      `
    } else if (view === "department") {
      details = await sql`
        WITH hierarchy_targets AS (
          SELECT 
            m.site,
            UPPER(
              CASE 
                WHEN m.level IN ('PJO', 'Deputy PJO') THEN 'Operasional'
                ELSE m.departemen
              END
            ) as department,
            m.id as leader_id,
            COUNT(*) as target
          FROM karyawan k
          JOIN karyawan m ON k.manager_id = m.id
          WHERE k.manager_id IS NOT NULL
          AND m.site = ${site}
          AND (
            m.level != 'Manager' 
            OR (m.level = 'Manager' AND m.site IN ('Head Office', 'BSF'))
          )
          GROUP BY m.site, 
            UPPER(
              CASE 
                WHEN m.level IN ('PJO', 'Deputy PJO') THEN 'Operasional'
                ELSE m.departemen
              END
            ), 
            m.id
        ),
        evidence_realization AS (
          SELECT 
            k.site,
            UPPER(
              CASE 
                WHEN k.level IN ('PJO', 'Deputy PJO') THEN 'Operasional'
                ELSE k.departemen
              END
            ) as department,
            e.leader_id,
            COUNT(DISTINCT e.subordinate_id) as realized_subordinates
          FROM tms_leadership_evidence e
          JOIN karyawan k ON e.leader_id = k.id
          WHERE e.activity_month = ${effectiveMonth}
          AND e.status = 'ACTIVE'
          AND k.site = ${site}
          GROUP BY k.site, 
            UPPER(
              CASE 
                WHEN k.level IN ('PJO', 'Deputy PJO') THEN 'Operasional'
                ELSE k.departemen
              END
            ), 
            e.leader_id
        )
        SELECT 
          ht.site,
          ht.department,
          NULL::uuid as leader_id,
          NULL::varchar as leader_name,
          SUM(ht.target)::integer as target,
          COALESCE(SUM(er.realized_subordinates), 0)::integer as realization,
          CASE 
            WHEN SUM(ht.target) > 0 THEN (COALESCE(SUM(er.realized_subordinates), 0)::decimal / SUM(ht.target)::decimal * 100)
            ELSE 0
          END::numeric as percentage
        FROM hierarchy_targets ht
        LEFT JOIN evidence_realization er ON ht.site = er.site AND ht.department = er.department AND ht.leader_id = er.leader_id
        GROUP BY ht.site, ht.department
        ORDER BY ht.department
      `
    } else if (view === "individual") {
      details = await sql`
        WITH hierarchy_targets AS (
          SELECT 
            m.site,
            UPPER(
              CASE 
                WHEN m.level IN ('PJO', 'Deputy PJO') THEN 'Operasional'
                ELSE m.departemen
              END
            ) as department,
            m.id as leader_id,
            m.nama_karyawan as leader_name,
            COUNT(*) as target
          FROM karyawan k
          JOIN karyawan m ON k.manager_id = m.id
          WHERE k.manager_id IS NOT NULL
          AND m.site = ${site}
          AND UPPER(
            CASE 
              WHEN m.level IN ('PJO', 'Deputy PJO') THEN 'Operasional'
              ELSE m.departemen
            END
          ) = UPPER(${department})
          AND (
            m.level != 'Manager' 
            OR (m.level = 'Manager' AND m.site IN ('Head Office', 'BSF'))
          )
          GROUP BY m.site, 
            UPPER(
              CASE 
                WHEN m.level IN ('PJO', 'Deputy PJO') THEN 'Operasional'
                ELSE m.departemen
              END
            ),
            m.id, m.nama_karyawan
        ),
        evidence_realization AS (
          SELECT 
            e.leader_id,
            COUNT(DISTINCT e.subordinate_id) as realized_subordinates
          FROM tms_leadership_evidence e
          JOIN karyawan k ON e.leader_id = k.id
          WHERE e.activity_month = ${effectiveMonth}
          AND e.status = 'ACTIVE'
          AND k.site = ${site}
          AND UPPER(
            CASE 
              WHEN k.level IN ('PJO', 'Deputy PJO') THEN 'Operasional'
              ELSE k.departemen
            END
          ) = UPPER(${department})
          GROUP BY e.leader_id
        )
        SELECT 
          ht.site,
          ht.department,
          ht.leader_id,
          ht.leader_name,
          ht.target::integer as target,
          COALESCE(er.realized_subordinates, 0)::integer as realization,
          CASE 
            WHEN ht.target > 0 THEN (COALESCE(er.realized_subordinates, 0)::decimal / ht.target::decimal * 100)
            ELSE 0
          END::numeric as percentage
        FROM hierarchy_targets ht
        LEFT JOIN evidence_realization er ON ht.leader_id = er.leader_id
        ORDER BY ht.leader_name
      `
    }

    console.log("[v0] Query result count:", details.length)
    console.log("[v0] Sample data:", details[0])

    // Calculate summary
    const summary = {
      target: details.reduce((sum: number, item: any) => sum + Number(item.target), 0),
      realization: details.reduce((sum: number, item: any) => sum + Number(item.realization), 0),
      percentage: 0,
    }

    if (summary.target > 0) {
      summary.percentage = (summary.realization / summary.target) * 100
    }

    console.log("[v0] Summary:", summary)

    return NextResponse.json({
      summary,
      details,
    })
  } catch (error) {
    console.error("[v0] GET monitoring error:", error)
    return NextResponse.json({ error: "Gagal mengambil data monitoring" }, { status: 500 })
  }
}
