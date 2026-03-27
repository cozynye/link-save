import { z } from 'zod';
import { APP_CONFIG } from '@/constants/config';

export const linkFormSchema = z.object({
  url: z
    .string()
    .min(1, 'URL을 입력해주세요')
    .refine(
      (val) => {
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: '올바른 URL 형식이 아닙니다' }
    ),
  title: z.string().max(APP_CONFIG.maxTitleLength, `제목은 ${APP_CONFIG.maxTitleLength}자 이내로 입력해주세요`).optional().default(''),
  description: z.string().max(APP_CONFIG.maxDescriptionLength, `설명은 ${APP_CONFIG.maxDescriptionLength}자 이내로 입력해주세요`).optional().default(''),
  tags: z.array(z.string()).max(APP_CONFIG.maxTagsPerLink, `태그는 최대 ${APP_CONFIG.maxTagsPerLink}개까지 선택할 수 있습니다`).default([]),
});

export type LinkFormSchema = z.infer<typeof linkFormSchema>;
