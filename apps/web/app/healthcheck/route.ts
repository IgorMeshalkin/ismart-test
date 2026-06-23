import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

  try {
    const response = await fetch(`${apiUrl}/healthcheck`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    const body = await response.text();

    if (!response.ok || body !== 'This is a api') {
      return NextResponse.json(
        {
          status: 'unhealthy',
          apiStatus: response.status,
          apiResponse: body,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: 'ok',
      api: body,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown API healthcheck error',
      },
      { status: 503 },
    );
  }
}
