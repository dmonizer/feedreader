import { NextRequest, NextResponse } from 'next/server';
import logger from '@/logger';

// Define allowed origins for CORS
const getAllowedOrigins = (): string[] => {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`:null,
    process.env.NODE_ENV==='development' ? 'http://localhost:3000':null,
  ].filter((origin): origin is string => Boolean(origin));
};

// Determine if origin is allowed and return appropriate CORS header value
const getCorsOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = getAllowedOrigins();

  // If no allowed origins configured, deny all
  if (allowedOrigins.length===0) {
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

const logAndReturn = (url: string | null, msg: string, code: number, result: string | {} | undefined = undefined, origin: string | null = null): NextResponse => {
  let logMessage = `url: ${url}, msg: ${msg}, code: ${code}`;

  if (result && typeof result==='string' && result?.length > 0) {
    logMessage += `, content: ${result.length} bytes, snippet: ${result.trim().slice(0, 250)}`;
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
    if (typeof result==='string') {
      return new NextResponse(result, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      });
    } else {
      return NextResponse.json(result, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...corsHeaders,
        },
      });
    }
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
  if (localHostnames.some(h => hostname.toLowerCase()===h)) {
    return true;
  }

  // Check if it's an IPv4 address
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    return (
      parts[0]===10 || // 10.0.0.0/8
      parts[0]===127 || // 127.0.0.0/8
      (parts[0]===172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
      (parts[0]===192 && parts[1]===168) || // 192.168.0.0/16
      (parts[0]===169 && parts[1]===254) // 169.254.0.0/16
    );
  }

  return false;
}

async function getOgImage(url: string, origin: string | null) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot 1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html', // Add HTML
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const contentType = response.headers.get('content-type');

    // Handle og:image extraction for HTML
    if (contentType?.includes('text/html')) {
      let ogImageMatch = new RegExp(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i).exec(text);
      if (!ogImageMatch?.[1]) {
        ogImageMatch = new RegExp(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i).exec(text);  // Also try reversed attribute order
      }

      const ogImage = ogImageMatch ? ogImageMatch[1]:null;

      return logAndReturn(url, 'OK', 200, {ogImage}, origin);
    }
  } catch (error) {
    if (error instanceof Error) {
      return logAndReturn(url, `Failed to fetch OG image: ${error.message}`, 502, undefined, origin);
    }
    return logAndReturn(url, 'Unknown error occurred while fetching OG image', 502, undefined, origin);
  }
  return logAndReturn(url, 'No OG image found', 404, undefined, origin);
}

function validateUrl(url: string | null) {
  let targetUrl: URL;
  if (!url) {
    return { targetUrl: null, error: { msg: 'URL parameter is required', code: 400 } };
  }
  try {
    targetUrl = new URL(url);
  } catch {
    return { targetUrl: null, error: { msg: 'Invalid URL format', code: 400 } };
  }

  // Only allow HTTP and HTTPS protocols
  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return { targetUrl: null, error: { msg: 'Only HTTP and HTTPS URLs are allowed', code: 400 } };
  }

  // SSRF Protection: Block access to private/internal addresses
  if (isPrivateIP(targetUrl.hostname)) {
    return { targetUrl: null, error: { msg: 'Access to private/internal addresses is not allowed', code: 403 } };
  }
  return { targetUrl, error: { msg: '', code: 200 } };
}

async function fetchUrl(targetUrl: URL, origin: string | null) {
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
      return logAndReturn(targetUrl.toString(), `HTTP ${response.status}: ${response.statusText}`, response.status, undefined, origin);
    }

    const contentType = response.headers.get('content-type') || '';

    // Check if response looks like RSS/XML content
    if (!contentType.includes('xml') &&
      !contentType.includes('rss') &&
      !contentType.includes('atom') &&
      !contentType.includes('text/html')) {
      logger.warn(`Unexpected content type: ${contentType} for URL: ${targetUrl.toString()}`);
    }

    const text = await response.text();

    // Basic validation that we got XML-like content
    if (!text.trim().startsWith('<')) {
      return logAndReturn(targetUrl.toString(), 'Response does not appear to be XML content: ' + text.slice(0, 200), 422, undefined, origin);
    }

    // Return the RSS content with proper headers
    return logAndReturn(targetUrl.toString(), 'OK', 200, text, origin);

  } catch (fetchError) {
    clearTimeout(timeoutId);

    if (fetchError instanceof Error) {
      if (fetchError.name==='AbortError') {
        return logAndReturn(targetUrl.toString(), `Request timeout - RSS feed took too long to respond`, 408, undefined, origin);
      }
      return logAndReturn(targetUrl.toString(), `Failed to fetch RSS feed: ${fetchError.message}`, 502, undefined, origin);
    }

    return logAndReturn(targetUrl.toString(), 'Unknown error occurred while fetching RSS feed', 502, undefined, origin);
  }


}

export async function GET(request: NextRequest) {
  logger.log('GET /proxy');
  const origin = request.headers.get('origin');

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const ogUrl = searchParams.get('ogUrl');
    logger.log(`Parameters - url: ${url}, ogUrl: ${ogUrl}, origin: ${origin}`);

    if (!url && !ogUrl) {
      return logAndReturn(url, 'URL parameter is required', 400, undefined, origin);
    }

    if (ogUrl) {
      const { targetUrl, error } = validateUrl(ogUrl);

      if (error?.code!==200 || !targetUrl) {
        return logAndReturn(targetUrl ? targetUrl?.toString():url, 'Error: ' + error.msg, error.code, undefined, origin);
      }

      return getOgImage(ogUrl, origin);
    }

    const { targetUrl, error } = validateUrl(url);

    if (error?.code !== 200 || !targetUrl) {
      return logAndReturn(url, 'Error: ' + error.msg, error.code, undefined, origin);
    }


    return fetchUrl(targetUrl, origin);
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
