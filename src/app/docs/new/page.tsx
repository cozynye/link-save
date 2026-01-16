'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateEntryMutation } from '@/domains/Docs/hooks/useDocsMutations';
import { useKeywordsQuery } from '@/domains/Docs/hooks/useKeywordsQuery';
import { MarkdownPreview } from '@/domains/Docs/components/MarkdownPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Eye, Edit } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import type { EntryFormData } from '@/domains/Docs/types';

// Prevent static generation due to useSearchParams
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function NewEntryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywordId = searchParams?.get('keyword');

  const createEntryMutation = useCreateEntryMutation();
  const { data: keywords } = useKeywordsQuery();

  const [formData, setFormData] = useState<EntryFormData>({
    keywordName: '',
    keywordId: undefined,
    title: '',
    content: '',
    tags: [],
  });

  // 쿼리 파라미터에서 키워드 ID를 받아온 경우 자동 설정
  useEffect(() => {
    if (keywordId && keywords) {
      const keyword = keywords.find((k) => k.id === keywordId);
      if (keyword) {
        setFormData((prev) => ({
          ...prev,
          keywordId: keyword.id,
          keywordName: keyword.name,
        }));
      }
    }
  }, [keywordId, keywords]);

  const [formErrors, setFormErrors] = useState<Partial<EntryFormData>>({});

  // 모바일 탭 상태
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const isLoading = createEntryMutation.isPending;
  const error = createEntryMutation.error;

  const validateForm = (): boolean => {
    const errors: Partial<EntryFormData> = {};

    if (!formData.keywordName?.trim()) {
      errors.keywordName = '키워드를 입력해주세요';
    }

    if (!formData.content?.trim()) {
      errors.content = '내용을 입력해주세요';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createEntryMutation.mutate(
      {
        keywordId: formData.keywordId,
        keywordName: formData.keywordName?.trim(),
        title: formData.title?.trim() || undefined,
        content: formData.content.trim(),
        tags: formData.tags,
      },
      {
        onSuccess: (entry) => {
          // 엔트리가 생성된 키워드 페이지로 이동
          router.push(`/docs/${entry.keyword_id}`);
        },
      }
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-[1240px] flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
          <h1 className="text-lg font-semibold">새 엔트리 작성</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto max-w-[1240px] px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Inputs */}
          <div className="space-y-4">
            {/* Keyword Name */}
            <div className="space-y-2">
              <Label htmlFor="keyword">
                키워드 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="keyword"
                type="text"
                placeholder="예: 클린코드, React Query"
                value={formData.keywordName}
                onChange={(e) =>
                  setFormData({ ...formData, keywordName: e.target.value })
                }
                className={formErrors.keywordName ? 'border-destructive' : ''}
              />
              {formErrors.keywordName && (
                <p className="text-sm text-destructive">{formErrors.keywordName}</p>
              )}
              <p className="text-xs text-muted-foreground">
                기존 키워드명을 입력하면 해당 키워드에 엔트리가 추가됩니다
              </p>
            </div>

            {/* Entry Title (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="title">엔트리 제목 (선택)</Label>
              <Input
                id="title"
                type="text"
                placeholder="예: 기본 개념, 실무 적용 사례"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                여러 엔트리를 구분하기 위한 제목입니다
              </p>
            </div>
          </div>

          {/* Mobile Tabs for Markdown Content */}
          <div className="md:hidden">
            <div className="flex gap-2 border-b">
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'edit'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground'
                }`}
                onClick={() => setActiveTab('edit')}
              >
                <Edit className="h-4 w-4 inline mr-1" />
                편집
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground'
                }`}
                onClick={() => setActiveTab('preview')}
              >
                <Eye className="h-4 w-4 inline mr-1" />
                미리보기
              </button>
            </div>
          </div>

          {/* Split View / Tabs */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Editor */}
            <div className={`space-y-2 ${activeTab === 'preview' ? 'hidden md:block' : ''}`}>
              <Label htmlFor="content">
                내용 (Markdown) <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="# 제목&#10;&#10;내용을 마크다운으로 작성하세요..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className={`min-h-[400px] md:min-h-[600px] font-mono ${
                  formErrors.content ? 'border-destructive' : ''
                }`}
              />
              {formErrors.content && (
                <p className="text-sm text-destructive">{formErrors.content}</p>
              )}
            </div>

            {/* Preview */}
            <div className={`space-y-2 ${activeTab === 'edit' ? 'hidden md:block' : ''}`}>
              <Label>미리보기</Label>
              <div className="border rounded-md p-4 min-h-[400px] md:min-h-[600px] overflow-auto bg-muted/20">
                {formData.content ? (
                  <MarkdownPreview content={formData.content} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    내용을 입력하면 미리보기가 표시됩니다
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </ProtectedRoute>
  );
}

export default function NewEntryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    }>
      <NewEntryForm />
    </Suspense>
  );
}
