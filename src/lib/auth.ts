/**
 * 보안 키 검증 유틸리티
 * 배포된 서비스에서 무단 데이터 접근을 방지하기 위한 간단한 인증
 */

export function validateAccessKey(key: string): boolean {
  const validKey = process.env.NEXT_PUBLIC_ACCESS_KEY;

  if (!validKey) {
    console.warn('⚠️ NEXT_PUBLIC_ACCESS_KEY가 설정되지 않았습니다');
    return false;
  }

  return key === validKey;
}

export function getAccessKey(): string {
  return process.env.NEXT_PUBLIC_ACCESS_KEY || '';
}
