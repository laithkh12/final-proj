import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBackendBase(): { base: string } | { error: string } {
  const raw = process.env.API_PROXY_URL?.trim().replace(/^["']|["']$/g, '');
  if (!raw) {
    return {
      error:
        'API_PROXY_URL is not set. On Vercel, set it to your Render URL, e.g. https://final-proj-yjse.onrender.com',
    };
  }

  let base = raw.replace(/\/$/, '');
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }

  if (!/^https?:\/\//i.test(base)) {
    return {
      error:
        'API_PROXY_URL must be a full backend URL starting with https:// (not /api). Example: https://final-proj-yjse.onrender.com',
    };
  }

  try {
    new URL(base);
  } catch {
    return { error: 'API_PROXY_URL is not a valid URL.' };
  }

  return { base };
}

const REQUEST_HEADERS = new Set([
  'accept',
  'accept-language',
  'authorization',
  'content-type',
  'cookie',
]);

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
  const backend = getBackendBase();
  if ('error' in backend) {
    return NextResponse.json({ success: false, message: backend.error }, { status: 503 });
  }

  try {
    const { path } = await context.params;
    const targetUrl = `${backend.base}/api/${path.join('/')}${request.nextUrl.search}`;

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!REQUEST_HEADERS.has(lower)) return;
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
      {
        success: false,
        message:
          'Failed to reach backend API. Check that API_PROXY_URL on Vercel is https://final-proj-yjse.onrender.com (no /api suffix).',
      },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
