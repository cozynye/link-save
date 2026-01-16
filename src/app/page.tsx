'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Link as LinkIcon, BookOpen, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/logo.png"
              alt="기억 로고"
              width={64}
              height={64}
              className="rounded-lg"
            />
            <h1 className="text-4xl font-bold tracking-tight">기억</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            링크 관리와 지식 정리를 위한 통합 플랫폼
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* SaveLink Card */}
          <Link href="/link" className="block group">
            <Card className="p-8 h-full hover:shadow-lg transition-all duration-200 border-2 hover:border-primary">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <LinkIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">SaveLink</h2>
                  <p className="text-muted-foreground">
                    중요한 링크를 저장하고 태그로 분류하여 효율적으로 관리하세요
                  </p>
                </div>
                <div className="mt-auto flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                  <span>링크 관리 시작하기</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Docs Card */}
          <Link href="/docs" className="block group">
            <Card className="p-8 h-full hover:shadow-lg transition-all duration-200 border-2 hover:border-primary">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Docs</h2>
                  <p className="text-muted-foreground">
                    키워드별로 지식을 정리하고 마크다운으로 문서화하세요
                  </p>
                </div>
                <div className="mt-auto flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                  <span>지식 정리 시작하기</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

