'use client';

import { ExternalLink, Calendar, Trash2, Edit, Pin } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TAG_COLORS } from '@/constants/categories';
import type { Link } from '../../types';

interface LinkCardProps {
  link: Link;
  onEdit?: (link: Link) => void;
  onDelete?: (link: Link) => void;
  onTogglePin?: (link: Link) => void;
}

export function LinkCard({ link, onEdit, onDelete, onTogglePin }: LinkCardProps) {
  const handleOpenLink = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow relative">
      {link.is_pinned && (
        <div className="absolute top-2 right-2 z-10">
          <Pin className="h-3 w-3 md:h-4 md:w-4 text-primary fill-primary" />
        </div>
      )}
      <CardHeader
        onClick={handleOpenLink}
        className="cursor-pointer pb-2 md:pb-3"
      >
        <div className="flex items-start justify-between gap-1 md:gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2 hover:text-primary text-sm md:text-base">
              {link.title}
            </CardTitle>
            <CardDescription className="mt-0.5 md:mt-1 line-clamp-1 break-all text-xs md:text-sm">
              {link.url}
            </CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenLink();
            }}
            className="shrink-0 h-7 w-7 md:h-10 md:w-10"
            aria-label="새 탭에서 열기"
          >
            <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </CardHeader>

      {link.description && (
        <CardContent
          onClick={handleOpenLink}
          className="cursor-pointer pt-0 pb-2 md:pb-3"
        >
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
            {link.description}
          </p>
        </CardContent>
      )}

      <CardFooter className="flex flex-col items-start gap-1.5 md:gap-2 pt-0">
        {/* 태그 */}
        {link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 md:gap-2 w-full">
            {link.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-medium ${
                  TAG_COLORS[tag] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 하단 액션 및 날짜 */}
        <div className="flex items-center justify-between w-full text-[10px] md:text-xs text-muted-foreground">
          <div className="flex items-center gap-0.5 md:gap-1">
            <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
            <span>{formatDate(link.created_at)}</span>
          </div>

          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {onTogglePin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(link);
                }}
                className="h-6 px-1.5 md:h-7 md:px-2 text-[10px] md:text-xs"
                aria-label={link.is_pinned ? '고정 해제' : '고정'}
              >
                <Pin className={`h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1 ${link.is_pinned ? 'fill-current' : ''}`} />
                {link.is_pinned ? '해제' : '고정'}
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(link);
                }}
                className="h-6 px-1.5 md:h-7 md:px-2 text-[10px] md:text-xs"
              >
                <Edit className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                수정
              </Button>
            )}
            {/* {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(link);
                }}
                className="h-7 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                삭제
              </Button>
            )} */}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
