/**
 * 표시용 날짜 포맷.
 *
 * 저장은 항상 ISO 8601(YYYY-MM-DD)로 하고, 화면에만 한글 표기를 쓴다.
 * (<time dateTime="..."> 의 값은 ISO 를 그대로 유지해 기계가 읽을 수 있게 한다)
 *
 * Intl 대신 직접 포맷한다 — 빌드 환경의 로캘·타임존에 따라
 * 결과가 달라지지 않도록 하기 위함이다.
 */
export function formatKoreanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;

  const [, y, mo, d] = m;
  return `${y}년 ${Number(mo)}월 ${Number(d)}일`;
}
