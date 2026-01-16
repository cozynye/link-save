"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_TAGS } from "@/constants/categories";
import { X } from "lucide-react";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  maxTags = 5,
}: TagSelectorProps) {
  const isTagSelected = (tag: string) => selectedTags.includes(tag);
  const canAddMoreTags = selectedTags.length < maxTags;

  const handleTagToggle = (tag: string) => {
    if (isTagSelected(tag)) {
      // 태그 제거
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else if (canAddMoreTags) {
      // 태그 추가
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-4">
      {/* 태그 선택 버튼들 */}
      <div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_TAGS.map((tag) => {
            const selected = isTagSelected(tag);
            const disabled = !selected && !canAddMoreTags;

            return (
              <Button
                key={tag}
                type="button"
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => handleTagToggle(tag)}
                disabled={disabled}
                className="text-sm"
              >
                {tag}
              </Button>
            );
          })}
        </div>
        {!canAddMoreTags && (
          <p className="text-xs text-muted-foreground mt-2">
            최대 {maxTags}개까지 선택 가능합니다
          </p>
        )}
      </div>
    </div>
  );
}
