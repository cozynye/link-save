'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateEntryMutation } from '@/domains/Docs/hooks/useDocsMutations';
import { supabase } from '@/lib/supabase/client';
import { MarkdownPreview } from '@/domains/Docs/components/MarkdownPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Eye, Edit } from 'lucide-react';
import type { EntryFormData, KeywordEntry } from '@/domains/Docs/types';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditEntryPage({ params }: PageProps) {
  const router = useRouter();
  const { id: entryId } = use(params);
  const updateEntryMutation = useUpdateEntryMutation();

  const [entry, setEntry] = useState<KeywordEntry | null>(null);
  const [formData, setFormData] = useState<Partial<EntryFormData>>({
    title: '',
    content: '',
  });
  const [accessKey, setAccessKey] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<EntryFormData & { accessKey?: string }>>({});
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isLoading, setIsLoading] = useState(true);

  // 엔트리 데이터 로드
  useEffect(() => {
    async function loadEntry() {
      const { data, error } = await supabase
        .from('keyword_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (error) {
        console.error('Failed to load entry:', error);
        return;
      }

      setEntry(data);
      setFormData({
        title: data.title || '',
        content: data.content,
      });
      setIsLoading(false);
    }

    loadEntry();
  }, [entryId]);

  const validateForm = (): boolean => {
    const errors: Partial<EntryFormData & { accessKey?: string }> = {};

    if (!formData.content?.trim()) {
      errors.content = '내용을 입력해주세요';
    }

    if (!accessKey.trim()) {
      errors.accessKey = '접근 키를 입력해주세요';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    updateEntryMutation.mutate(
      {
        id: entryId,
        data: {
          title: formData.title?.trim() || undefined,
          content: formData.content!.trim(),
        },
        accessKey: accessKey.trim(),
      },
      {
        onSuccess: () => {
          if (entry) {
            router.push(`/docs/${entry.keyword_id}`);
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
          <h1 className="text-lg font-semibold">엔트리 수정</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="md:hidden border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-2">
            <button
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
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Inputs */}
          <div className="space-y-4">
            {/* Entry Title */}
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
            </div>

            {/* Access Key */}
            <div className="space-y-2">
              <Label htmlFor="accessKey">
                접근 키 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accessKey"
                type="password"
                placeholder="접근 키를 입력하세요"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className={formErrors.accessKey ? 'border-destructive' : ''}
              />
              {formErrors.accessKey && (
                <p className="text-sm text-destructive">{formErrors.accessKey}</p>
              )}
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
          {updateEntryMutation.error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {updateEntryMutation.error instanceof Error
                ? updateEntryMutation.error.message
                : '알 수 없는 오류가 발생했습니다'}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={updateEntryMutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={updateEntryMutation.isPending}>
              {updateEntryMutation.isPending ? '수정 중...' : '수정'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
