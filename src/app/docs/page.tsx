'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeywordsQuery } from '@/domains/Docs/hooks/useKeywordsQuery';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, BookOpen, ArrowUpDown } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import type { DocsFilterOptions } from '@/domains/Docs/types';

export default function DocsPage() {
  const router = useRouter();
  const [filterOptions, setFilterOptions] = useState<DocsFilterOptions>({
    sortBy: 'updated_at',
    sortOrder: 'desc',
  });
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

  const toggleSort = () => {
    setFilterOptions((prev) => ({
      ...prev,
      sortBy: prev.sortBy === 'updated_at' ? 'name' : 'updated_at',
      sortOrder: prev.sortBy === 'updated_at' ? 'asc' : 'desc',
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <Header />

        {/* Main Content */}
        <div className="container mx-auto max-w-[1240px] px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-4">
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

        {/* Sort Toggle */}
        <div className="mb-6 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSort}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {filterOptions.sortBy === 'updated_at' ? '최신순' : '이름순'}
          </Button>
        </div>

        {/* Keywords Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            로딩 중...
          </div>
        ) : keywords && keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <div
                key={keyword.id}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card hover:bg-accent hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => handleKeywordClick(keyword.id)}
              >
                <span className="font-medium group-hover:text-primary transition-colors">
                  {keyword.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {keyword.entry_count || 0}
                </span>
              </div>
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
    </ProtectedRoute>
  );
}
