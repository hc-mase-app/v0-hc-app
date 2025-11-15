import { NextResponse } from "next/server"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string | null
  stats?: Record<string, any>
  message?: string
}

/**
 * Create a standardized success response
 * CHANGE: New utility to ensure consistent API response format
 */
export function successResponse<T>(
  data: T,
  stats?: Record<string, any>,
  message?: string,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      stats,
      error: null,
      message,
    },
    { status: 200 },
  )
}

/**
 * Create a standardized error response
 * CHANGE: New utility to ensure consistent error format
 */
export function errorResponse(error: string | Error, statusCode = 500): NextResponse<ApiResponse> {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[API Error] ${statusCode}: ${errorMessage}`)

  return NextResponse.json(
    {
      success: false,
      data: null,
      error: errorMessage,
      stats: null,
    },
    { status: statusCode },
  )
}

/**
 * Wrap async API handlers with error handling
 * CHANGE: New utility for try-catch wrapper
 */
export async function withErrorHandling<T>(handler: () => Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const result = await handler()
    return [result, null]
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}
