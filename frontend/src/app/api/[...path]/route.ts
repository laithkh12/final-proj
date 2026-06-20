import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBackendBase(): string | null {
  const raw = process.env.API_PROXY_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const backendBase = getBackendBase();
  if (!backendBase) {
    return NextResponse.json(
      {
        success: false,
        message:
          'API proxy is not configured. Set API_PROXY_URL on Vercel to your Render backend URL.',
      },
      { status: 503 }
    );
  }

  try {
    const { path } = await context.params;
    const targetUrl = `${backendBase}/api/${path.join('/')}${request.nextUrl.search}`;

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'host' || HOP_BY_HOP.has(lower)) return;
      headers.set(key, value);
    });

    const init: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer();
    }

    const backendRes = await fetch(targetUrl, init);
    const body = await backendRes.arrayBuffer();
    const responseHeaders = new Headers();

    backendRes.headers.forEach((value, key) => {
      if (HOP_BY_HOP.has(key.toLowerCase())) return;
      responseHeaders.append(key, value);
    });

    const setCookies =
      typeof backendRes.headers.getSetCookie === 'function'
        ? backendRes.headers.getSetCookie()
        : [];

    if (setCookies.length > 0) {
      responseHeaders.delete('set-cookie');
      for (const cookie of setCookies) {
        responseHeaders.append('set-cookie', cookie);
      }
    }

    return new NextResponse(body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reach backend API' },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
