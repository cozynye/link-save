"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalContent,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagSelector } from "../TagSelector";
import {
  useCreateLinkMutation,
  useUpdateLinkMutation,
} from "../../hooks/useLinkMutations";
import { Plus } from "lucide-react";
import type { LinkFormData, Link } from "../../types";

interface LinkFormProps {
  editLink?: Link | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LinkForm({
  editLink,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: LinkFormProps) {
  const isEditMode = !!editLink;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [formData, setFormData] = useState<LinkFormData>({
    url: "",
    title: "",
    description: "",
    tags: [],
  });
  const [formErrors, setFormErrors] = useState<Partial<LinkFormData>>({});

  const createLinkMutation = useCreateLinkMutation();
  const updateLinkMutation = useUpdateLinkMutation();

  const isLoading =
    createLinkMutation.isPending || updateLinkMutation.isPending;
  const error = createLinkMutation.error || updateLinkMutation.error;

  // 수정 모드일 때 폼 데이터 초기화
  useEffect(() => {
    if (editLink && open) {
      setFormData({
        url: editLink.url,
        title: editLink.title,
        description: editLink.description || "",
        tags: editLink.tags,
      });
    }
  }, [editLink, open]);

  const validateForm = (): boolean => {
    const errors: Partial<LinkFormData> = {};

    // URL 필수 검증
    if (!formData.url.trim()) {
      errors.url = "URL을 입력해주세요";
    } else {
      // URL 형식 검증
      try {
        new URL(formData.url);
      } catch {
        errors.url = "올바른 URL 형식이 아닙니다";
      }
    }

    // 제목 필수 검증
    if (!formData.title.trim()) {
      errors.title = "제목을 입력해주세요";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditMode && editLink) {
      // 수정 모드
      updateLinkMutation.mutate(
        {
          id: editLink.id,
          data: {
            url: formData.url.trim(),
            title: formData.title.trim(),
            description: formData.description?.trim() || null,
            tags: formData.tags,
          },
        },
        {
          onSuccess: () => {
            // 성공 시 폼 초기화 및 닫기
            setFormData({
              url: "",
              title: "",
              description: "",
              tags: [],
            });
            setFormErrors({});
            setOpen(false);
            onSuccess?.();
          },
        }
      );
    } else {
      // 생성 모드
      createLinkMutation.mutate(
        {
          url: formData.url.trim(),
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          tags: formData.tags,
        },
        {
          onSuccess: () => {
            // 성공 시 폼 초기화 및 닫기
            setFormData({
              url: "",
              title: "",
              description: "",
              tags: [],
            });
            setFormErrors({});
            setOpen(false);
            onSuccess?.();
          },
        }
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // 다이얼로그 닫을 때 폼 초기화
      setFormData({
        url: "",
        title: "",
        description: "",
        tags: [],
      });
      setFormErrors({});
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange}>
      {!isEditMode && (
        <ResponsiveModalTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            링크 추가
          </Button>
        </ResponsiveModalTrigger>
      )}
      <ResponsiveModalContent
        title={isEditMode ? "링크 수정" : "새 링크 추가"}
        description={
          isEditMode
            ? "링크 정보를 수정하세요"
            : "저장하고 싶은 링크의 정보를 입력하세요"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL 입력 */}
          <div className="space-y-2">
            <Label htmlFor="url">
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              name="url"
              type="text"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              className={formErrors.url ? "border-destructive" : ""}
            />
            {formErrors.url && (
              <p className="text-sm text-destructive">{formErrors.url}</p>
            )}
          </div>

          {/* 제목 입력 */}
          <div className="space-y-2">
            <Label htmlFor="title">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="링크 제목을 입력하세요"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={formErrors.title ? "border-destructive" : ""}
            />
            {formErrors.title && (
              <p className="text-sm text-destructive">{formErrors.title}</p>
            )}
          </div>

          {/* 설명 입력 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="링크에 대한 간단한 설명을 입력하세요"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* 태그 선택 */}
          <div className="space-y-2">
            <Label>태그 (선택)</Label>
            <TagSelector
              selectedTags={formData.tags}
              onTagsChange={(tags) => setFormData({ ...formData, tags })}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error instanceof Error
                ? error.message
                : "알 수 없는 오류가 발생했습니다"}
            </div>
          )}
        </form>

        <ResponsiveModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="flex-1 md:flex-none"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            onClick={handleSubmit}
            className="flex-1 md:flex-none"
          >
            {isLoading
              ? isEditMode
                ? "수정 중..."
                : "저장 중..."
              : isEditMode
              ? "수정"
              : "저장"}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
