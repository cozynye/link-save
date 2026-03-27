import { z } from 'zod';

export const entryFormSchema = z.object({
  keywordName: z.string().min(1, '키워드를 입력해주세요').optional(),
  keywordId: z.string().optional(),
  title: z.string().optional().default(''),
  content: z.string().min(1, '내용을 입력해주세요'),
  tags: z.array(z.string()).default([]),
});

export const entryUpdateSchema = z.object({
  title: z.string().optional().default(''),
  content: z.string().min(1, '내용을 입력해주세요'),
});

export type EntryFormSchema = z.infer<typeof entryFormSchema>;
export type EntryUpdateSchema = z.infer<typeof entryUpdateSchema>;
