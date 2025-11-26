import { NextRequest, NextResponse } from 'next/server';
import logger from '@/logger';

// Define allowed origins for CORS
const getAllowedOrigins = (): string[] => {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  ].filter((origin): origin is string => Boolean(origin));
};

// Determine if origin is allowed and return appropriate CORS header value
const getCorsOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = getAllowedOrigins();

  // If no allowed origins configured, deny all
  if (allowedOrigins.length === 0) {
    logger.warn('No allowed origins configured for CORS');
    return '';
  }

  // Check if request origin is in allowed list
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Default to first allowed origin if request origin not allowed
  return allowedOrigins[0];
};

const logAndReturn = (url: string | null, msg: string, code: number, result: string | undefined = undefined, origin: string | null = null): NextResponse => {
  let logMessage = `url: ${url}, msg: ${msg}, code: ${code}`

  if (result && result?.length>0) {
    logMessage += `, content: ${result.length} bytes, snippet: ${result.trim().slice(0,250)}`
  }

  logger.log(logMessage);

  const allowOrigin = getCorsOrigin(origin);
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Only add CORS origin header if we have a valid allowed origin
  if (allowOrigin) {
    corsHeaders['Access-Control-Allow-Origin'] = allowOrigin;
  }

  if (code===200 && result) {
    return new NextResponse(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  }
  return NextResponse.json(
    { error: msg },
    {
      status: code,
      headers: corsHeaders,
    },
  );
};

function isPrivateIP(hostname: string): boolean {
  // Block localhost/loopback
  const localHostnames = ['localhost', '0.0.0.0', '127.0.0.1', '::1'];
  if (localHostnames.some(h => hostname.toLowerCase() === h)) {
    return true;
  }

  // Check if it's an IPv4 address
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    return (
      parts[0] === 10 || // 10.0.0.0/8
      parts[0] === 127 || // 127.0.0.0/8
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
      (parts[0] === 192 && parts[1] === 168) || // 192.168.0.0/16
      (parts[0] === 169 && parts[1] === 254) // 169.254.0.0/16
    );
  }

  return false;
}

export async function GET(request: NextRequest) {
  logger.log('GET /rss-proxy');
  const origin = request.headers.get('origin');

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return logAndReturn(url, 'URL parameter is required', 400, undefined, origin);
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return logAndReturn(url, 'Invalid URL format', 400, undefined, origin);
    }

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return logAndReturn(url, 'Only HTTP and HTTPS URLs are allowed', 400, undefined, origin);
    }

    // SSRF Protection: Block access to private/internal addresses
    if (isPrivateIP(targetUrl.hostname)) {
      return logAndReturn(url, 'Access to private/internal addresses is not allowed', 403, undefined, origin);
    }

    // Fetch the RSS feed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(targetUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'RSS Reader Bot/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return logAndReturn(url, `HTTP ${response.status}: ${response.statusText}`, response.status, undefined, origin);
      }

      const contentType = response.headers.get('content-type') || '';

      // Check if response looks like RSS/XML content
      if (!contentType.includes('xml') &&
        !contentType.includes('rss') &&
        !contentType.includes('atom') &&
        !contentType.includes('text/html')) {
        logger.warn(`Unexpected content type: ${contentType} for URL: ${url}`);
      }

      const text = await response.text();

      // Basic validation that we got XML-like content
      if (!text.trim().startsWith('<')) {
        return logAndReturn(url, 'Response does not appear to be XML content: ' + text.slice(0, 200), 422, undefined, origin);
      }

      // Return the RSS content with proper headers
      return logAndReturn(url, 'OK', 200, text, origin);

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error) {


        if (fetchError.name==='AbortError') {
          return logAndReturn(url, `Request timeout - RSS feed took too long to respond`, 408, undefined, origin);
        }
        return logAndReturn(url, `Failed to fetch RSS feed: ${fetchError.message}`, 502, undefined, origin);
      }

      return logAndReturn(url, 'Unknown error occurred while fetching RSS feed', 502, undefined, origin);
    }

  } catch (error) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    return logAndReturn(url, `RSS Proxy Error: { ${url}, ${error} }`, 500, undefined, origin);
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowOrigin = getCorsOrigin(origin);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Only add CORS origin header if we have a valid allowed origin
  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
  }

  return new NextResponse(null, {
    status: 200,
    headers,
  });
}
