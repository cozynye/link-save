import { describe, expect, it } from 'vitest'
import { hostnameOf, isTrackingParam, looksLikeUrl, normalizeUrl } from './normalizeUrl'

describe('normalizeUrl', () => {
  it('앞뒤 공백과 줄바꿈을 제거하고 스킴이 없으면 https를 붙인다', () => {
    expect(normalizeUrl('  example.com/post \n')).toEqual({ ok: true, url: 'https://example.com/post' })
  })
  it('호스트와 프로토콜을 소문자로 만든다', () => {
    expect(normalizeUrl('HTTPS://Example.COM/Path')).toEqual({ ok: true, url: 'https://example.com/Path' })
  })
  it('해시를 제거한다', () => {
    expect(normalizeUrl('https://example.com/a#section')).toEqual({ ok: true, url: 'https://example.com/a' })
  })
  it('추적 파라미터만 제거하고 나머지 순서는 유지한다', () => {
    const r = normalizeUrl('https://example.com/a?b=2&utm_source=x&a=1&fbclid=zzz&gclid=1&igshid=2&mc_cid=3&mc_eid=4')
    expect(r).toEqual({ ok: true, url: 'https://example.com/a?b=2&a=1' })
  })
  it('경로가 /가 아니면 끝 슬래시를 제거하고, /는 유지한다', () => {
    expect(normalizeUrl('https://example.com/a/b/')).toEqual({ ok: true, url: 'https://example.com/a/b' })
    expect(normalizeUrl('https://example.com')).toEqual({ ok: true, url: 'https://example.com/' })
    expect(normalizeUrl('https://example.com/')).toEqual({ ok: true, url: 'https://example.com/' })
  })
  it('빈 입력은 empty', () => {
    expect(normalizeUrl('   ')).toEqual({ ok: false, reason: 'empty' })
  })
  it('http/https 외 프로토콜은 protocol', () => {
    expect(normalizeUrl('ftp://example.com/x')).toEqual({ ok: false, reason: 'protocol' })
    expect(normalizeUrl('javascript:alert(1)')).toEqual({ ok: false, reason: 'protocol' })
  })
  it('점이 없는 호스트와 파싱 불가 입력은 invalid', () => {
    expect(normalizeUrl('hello world')).toEqual({ ok: false, reason: 'invalid' })
    expect(normalizeUrl('http://')).toEqual({ ok: false, reason: 'invalid' })
  })
  it('localhost는 허용한다', () => {
    expect(normalizeUrl('http://localhost:5173/x')).toEqual({ ok: true, url: 'http://localhost:5173/x' })
  })
})

describe('isTrackingParam', () => {
  it('utm_ 접두어와 지정된 이름을 대소문자 무관하게 잡는다', () => {
    expect(isTrackingParam('utm_campaign')).toBe(true)
    expect(isTrackingParam('UTM_Source')).toBe(true)
    expect(isTrackingParam('FBCLID')).toBe(true)
    expect(isTrackingParam('ref')).toBe(false)
  })
})

describe('hostnameOf', () => {
  it('www.를 떼고 호스트만 돌려준다', () => {
    expect(hostnameOf('https://www.example.com/a')).toBe('example.com')
    expect(hostnameOf('not a url')).toBe('')
  })
})

describe('looksLikeUrl', () => {
  it('URL처럼 보이는 한 줄 텍스트만 true', () => {
    expect(looksLikeUrl('https://example.com/a')).toBe(true)
    expect(looksLikeUrl('example.com')).toBe(true)
    expect(looksLikeUrl('오늘 할 일')).toBe(false)
    expect(looksLikeUrl('https://a.com and https://b.com')).toBe(false)
  })
})
