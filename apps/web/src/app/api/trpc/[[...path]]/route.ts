import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function internalApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4000'
  ).replace(/\/$/, '');
}

async function proxyTrpc(req: NextRequest, pathSegments: string[] | undefined): Promise<Response> {
  const path = pathSegments?.join('/') ?? '';
  const targetUrl = `${internalApiBaseUrl()}/trpc/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const cookie = req.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const authorization = req.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  return fetch(targetUrl, init);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const res = await proxyTrpc(req, path);
  return new NextResponse(res.body, { status: res.status, headers: res.headers });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const res = await proxyTrpc(req, path);
  return new NextResponse(res.body, { status: res.status, headers: res.headers });
}
