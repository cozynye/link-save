'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeywordEntriesQuery } from '@/domains/Docs/hooks/useKeywordEntriesQuery';
import { useKeywordsQuery } from '@/domains/Docs/hooks/useKeywordsQuery';
import { MarkdownPreview } from '@/domains/Docs/components/MarkdownPreview';
import { EntryDeleteDialog } from '@/domains/Docs/components/EntryDeleteDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientDate } from '@/components/ui/client-date';
import { ArrowLeft, Plus, Calendar, Edit, Trash2 } from 'lucide-react';
import type { KeywordEntry } from '@/domains/Docs/types';

interface PageProps {
  params: Promise<{
    keyword: string;
  }>;
}

export default function KeywordDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { keyword: keywordId } = use(params);

  const { data: keywords } = useKeywordsQuery();
  const { data: entries, isLoading } = useKeywordEntriesQuery(keywordId);

  const [deletingEntry, setDeletingEntry] = useState<KeywordEntry | null>(null);

  const keyword = keywords?.find((k) => k.id === keywordId);

  const handleAddEntry = () => {
    router.push(`/docs/new?keyword=${keywordId}`);
  };

  const handleEditEntry = (entry: KeywordEntry) => {
    router.push(`/docs/edit/${entry.id}`);
  };

  const handleDeleteEntry = (entry: KeywordEntry) => {
    setDeletingEntry(entry);
  };

  const handleDeleteSuccess = () => {
    setDeletingEntry(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/docs')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            목록
          </Button>
          <h1 className="text-lg font-semibold line-clamp-1">
            {keyword?.name || '로딩 중...'}
          </h1>
          <Button size="sm" onClick={handleAddEntry} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">추가</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Keyword Info */}
        {keyword && (
          <div className="mb-8 space-y-2">
            {keyword.description && (
              <p className="text-muted-foreground">{keyword.description}</p>
            )}
            {keyword.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {keyword.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline Entries */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            로딩 중...
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-6">
                {/* Entry Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {entry.title && (
                      <h2 className="text-lg font-semibold mb-1">{entry.title}</h2>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <ClientDate date={entry.created_at} />
                      {entry.updated_at !== entry.created_at && (
                        <span className="text-xs">(수정됨)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditEntry(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEntry(entry)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Entry Content */}
                <div className="border-t pt-4">
                  <MarkdownPreview content={entry.content} />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              아직 엔트리가 없습니다
            </p>
            <Button onClick={handleAddEntry}>
              <Plus className="h-4 w-4 mr-2" />
              첫 엔트리 작성하기
            </Button>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <EntryDeleteDialog
        entry={deletingEntry}
        open={!!deletingEntry}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
