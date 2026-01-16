'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeywordsQuery } from '@/domains/Docs/hooks/useKeywordsQuery';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientDate } from '@/components/ui/client-date';
import { Plus, Search, BookOpen, Calendar } from 'lucide-react';
import type { DocsFilterOptions } from '@/domains/Docs/types';

export default function DocsPage() {
  const router = useRouter();
  const [filterOptions, setFilterOptions] = useState<DocsFilterOptions>({});
  const [searchInput, setSearchInput] = useState('');

  const { data: keywords, isLoading } = useKeywordsQuery(filterOptions);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterOptions({
      ...filterOptions,
      searchKeyword: searchInput,
    });
  };

  const handleKeywordClick = (keywordId: string) => {
    router.push(`/docs/${keywordId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="키워드 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Keywords Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            로딩 중...
          </div>
        ) : keywords && keywords.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {keywords.map((keyword) => (
              <Card
                key={keyword.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleKeywordClick(keyword.id)}
              >
                <div className="space-y-3">
                  {/* Keyword Name */}
                  <div>
                    <h2 className="text-lg font-semibold line-clamp-1">
                      {keyword.name}
                    </h2>
                    {keyword.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {keyword.description}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {keyword.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {keyword.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <ClientDate date={keyword.updated_at} format="date" />
                    </div>
                    <div>
                      {keyword.entry_count || 0}개 엔트리
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {filterOptions.searchKeyword
                ? '검색 결과가 없습니다'
                : '아직 키워드가 없습니다'}
            </p>
            <Button onClick={() => router.push('/docs/new')}>
              <Plus className="h-4 w-4 mr-2" />
              첫 엔트리 작성하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
