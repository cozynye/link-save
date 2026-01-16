/**
 * 기본 카테고리/태그 목록
 * 사용자가 링크 저장 시 선택할 수 있는 미리 정의된 카테고리
 */
export const DEFAULT_TAGS = [
  "AI",
  "아키텍처",
  "클린코드",
  "면접",
  "CS",
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "CSS",
  "디자인",
  "성능 최적화",
  "클로드",
  "보안",
  "테스팅",
  "배포",
  "도구",
  "레퍼런스",
  "공식 문서",
  "튜토리얼",
  "아티클",
  "영상",
  "IDE",
  "기타",
] as const;

export type DefaultTag = (typeof DEFAULT_TAGS)[number];

/**
 * 태그 색상 매핑 (Badge 컴포넌트에서 사용)
 */
export const TAG_COLORS: Record<string, string> = {
  AI: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  아키텍처: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  클린코드: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  면접: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  React: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  "Next.js": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  TypeScript:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  JavaScript:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  CSS: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  디자인:
    "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300",
  "성능 최적화":
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  클로드: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  보안: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
  테스팅: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300",
  배포: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  도구: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  레퍼런스:
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  "공식 문서": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  튜토리얼: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  아티클: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  영상: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  기타: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};
