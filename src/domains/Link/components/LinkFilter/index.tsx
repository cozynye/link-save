"use client";

import { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DEFAULT_TAGS } from "@/constants/categories";
import type { LinkFilterOptions } from "../../types";

interface LinkFilterProps {
  onFilterChange: (filters: LinkFilterOptions) => void;
}

export function LinkFilter({ onFilterChange }: LinkFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"created_at" | "title" | "updated_at">("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 모바일 시트용 임시 상태
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempSortBy, setTempSortBy] = useState<"created_at" | "title" | "updated_at">("updated_at");
  const [tempSortOrder, setTempSortOrder] = useState<"asc" | "desc">("desc");

  // 필터 업데이트 헬퍼
  const updateFilters = (
    newSearch?: string,
    newTags?: string[],
    newSortBy?: "created_at" | "title" | "updated_at",
    newSortOrder?: "asc" | "desc"
  ) => {
    onFilterChange({
      searchQuery: newSearch !== undefined ? newSearch : searchQuery,
      tags: newTags !== undefined ? newTags : selectedTags,
      sortBy: newSortBy !== undefined ? newSortBy : sortBy,
      sortOrder: newSortOrder !== undefined ? newSortOrder : sortOrder,
    });
  };

  // 검색어 변경
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateFilters(value);
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchQuery("");
    updateFilters("");
  };

  // 태그 토글
  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    updateFilters(undefined, newTags);
  };

  // 태그 전체 초기화
  const handleClearTags = () => {
    setSelectedTags([]);
    updateFilters(undefined, []);
  };

  // 정렬 방식 변경
  const handleSortByChange = (value: "created_at" | "title" | "updated_at") => {
    setSortBy(value);
    updateFilters(undefined, undefined, value);
  };

  // 정렬 순서 변경
  const handleSortOrderChange = (value: "asc" | "desc") => {
    setSortOrder(value);
    updateFilters(undefined, undefined, undefined, value);
  };

  // 모바일 시트 열기
  const handleSheetOpenChange = (open: boolean) => {
    if (open) {
      // 시트 열 때 현재 값을 임시 상태로 복사
      setTempTags(selectedTags);
      setTempSortBy(sortBy);
      setTempSortOrder(sortOrder);
    }
    setSheetOpen(open);
  };

  // 모바일 시트 - 취소
  const handleSheetCancel = () => {
    setSheetOpen(false);
  };

  // 모바일 시트 - 적용하기
  const handleSheetApply = () => {
    setSelectedTags(tempTags);
    setSortBy(tempSortBy);
    setSortOrder(tempSortOrder);
    updateFilters(undefined, tempTags, tempSortBy, tempSortOrder);
    setSheetOpen(false);
  };

  // 데스크톱 필터 옵션 렌더링 함수
  const renderFilterOptions = () => (
    <>
      {/* 정렬 옵션 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">정렬</h3>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">수정일</SelectItem>
              <SelectItem value="created_at">생성일</SelectItem>
              <SelectItem value="title">제목</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={handleSortOrderChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">내림차순</SelectItem>
              <SelectItem value="asc">오름차순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 태그 필터 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">태그</h3>
          {selectedTags.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedTags.length}개 태그로 필터링 중
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* 전체 버튼 */}
          <Button
            variant={selectedTags.length === 0 ? "default" : "outline"}
            size="sm"
            onClick={handleClearTags}
            className="h-8"
          >
            전체
          </Button>

          {DEFAULT_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Button
                key={tag}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleTagToggle(tag)}
                className="h-8"
              >
                {tag}
                {isSelected && (
                  <X className="ml-1 h-3 w-3" aria-label={`${tag} 필터 제거`} />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );

  // 모바일 시트 필터 옵션 렌더링 함수
  const renderMobileFilterOptions = () => (
    <>
      {/* 정렬 옵션 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">정렬</h3>
        <div className="flex gap-2">
          <Select value={tempSortBy} onValueChange={(value) => setTempSortBy(value as typeof tempSortBy)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">수정일</SelectItem>
              <SelectItem value="created_at">생성일</SelectItem>
              <SelectItem value="title">제목</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tempSortOrder} onValueChange={(value) => setTempSortOrder(value as typeof tempSortOrder)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">내림차순</SelectItem>
              <SelectItem value="asc">오름차순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 태그 필터 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">태그</h3>
          {tempTags.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {tempTags.length}개 태그로 필터링 중
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* 전체 버튼 */}
          <Button
            variant={tempTags.length === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setTempTags([])}
            className="h-8"
          >
            전체
          </Button>

          {DEFAULT_TAGS.map((tag) => {
            const isSelected = tempTags.includes(tag);
            return (
              <Button
                key={tag}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (isSelected) {
                    setTempTags(tempTags.filter((t) => t !== tag));
                  } else {
                    setTempTags([...tempTags, tag]);
                  }
                }}
                className="h-8"
              >
                {tag}
                {isSelected && (
                  <X className="ml-1 h-3 w-3" aria-label={`${tag} 필터 제거`} />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 버튼 */}
      <div className="flex gap-2">
        {/* 검색 입력 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="제목 또는 URL로 검색..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              aria-label="검색어 지우기"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 모바일 필터 버튼 */}
        <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[80vh] border-t-4 border-border rounded-t-lg pb-0"
          >
            <SheetHeader>
              <SheetTitle>필터 및 정렬</SheetTitle>
              <SheetDescription>링크를 필터링하고 정렬하세요</SheetDescription>
            </SheetHeader>
            <div className="mt-3 space-y-6 overflow-y-auto max-h-[calc(80vh-180px)] px-4 scrollbar-hide">
              {renderMobileFilterOptions()}
            </div>
            {/* 하단 버튼 */}
            <div className="sticky bottom-0 flex gap-2 p-4 bg-background border-t mt-auto">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSheetCancel}
              >
                취소
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleSheetApply}
              >
                적용하기
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 데스크톱 필터 옵션 */}
      <div className="hidden md:block space-y-4">{renderFilterOptions()}</div>
    </div>
  );
}
