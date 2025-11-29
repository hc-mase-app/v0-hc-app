import { neon } from "@neondatabase/serverless"

// Create a reusable SQL client using Neon serverless driver
export const sql = neon(process.env.DATABASE_URL!)
