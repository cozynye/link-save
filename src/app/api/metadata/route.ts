import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
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

    // URL에서 HTML 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkBot/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch URL' },
        { status: response.status }
      );
    }

    const html = await response.text();

    // 메타태그 추출
    const metadata = extractMetadata(html);

    return NextResponse.json(metadata);
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
