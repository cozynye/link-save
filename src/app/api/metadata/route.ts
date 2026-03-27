import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const MAX_RESPONSE_SIZE = 512 * 1024; // 512KB
const FETCH_TIMEOUT_MS = 5000;

/**
 * 내부/프라이빗 IP 대역 URL 차단
 */
function isPrivateUrl(urlString: string): boolean {
  const parsed = new URL(urlString);
  const hostname = parsed.hostname.toLowerCase();

  // localhost 및 루프백
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]' ||
    hostname === '::1'
  ) {
    return true;
  }

  // 프라이빗 IP 대역
  const parts = hostname.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts.map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16
  }

  // 프로토콜 제한 (http/https만 허용)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // URL 유효성 검증
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // 내부 IP 차단 (SSRF 방지)
    if (isPrivateUrl(url)) {
      return NextResponse.json(
        { error: 'Internal URLs are not allowed' },
        { status: 400 }
      );
    }

    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkBot/1.0)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch URL' },
          { status: response.status }
        );
      }

      // 응답 크기 제한
      const html = await response.text();
      const limitedHtml = html.slice(0, MAX_RESPONSE_SIZE);

      const metadata = extractMetadata(limitedHtml);

      return NextResponse.json(metadata);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 408 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract metadata' },
      { status: 500 }
    );
  }
}

function extractMetadata(html: string): {
  title: string;
  description: string;
} {
  // Open Graph 태그 우선 확인
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  const ogDescriptionMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);

  // 일반 메타태그
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const descriptionMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);

  const title = ogTitleMatch?.[1] || titleMatch?.[1] || '';
  const description = ogDescriptionMatch?.[1] || descriptionMatch?.[1] || '';

  return {
    title: decodeHTMLEntities(title.trim()),
    description: decodeHTMLEntities(description.trim()),
  };
}

function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&#039;': "'",
    '&apos;': "'",
  };

  return text.replace(/&[#a-z0-9]+;/gi, (entity) => {
    return entities[entity.toLowerCase()] || entity;
  });
}
