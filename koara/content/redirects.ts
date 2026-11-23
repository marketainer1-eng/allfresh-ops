/**
 * 301 redirect 규칙
 *
 * URL 이 바뀌거나 이전 사이트에서 이전할 때 여기에 추가한다.
 * next.config.ts 의 redirects() 가 이 배열을 그대로 사용한다.
 *
 * 예)
 * { source: "/blog/:slug", destination: "/story/:slug", permanent: true }
 */

export interface RedirectRule {
  source: string;
  destination: string;
  /** true = 301, false = 307 */
  permanent: boolean;
}

export const redirects: RedirectRule[] = [];
