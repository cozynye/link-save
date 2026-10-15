export function bookmarkletCode(origin: string): string {
  return `javascript:void(window.open('${origin}/?url='+encodeURIComponent(location.href),'_blank'))`
}
