/**
 * JSON-LD 출력.
 * 서버에서 렌더되므로 크롤러와 AI가 HTML 소스에서 바로 읽을 수 있다.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // 데이터는 content/* 의 정적 값에서만 오며 사용자 입력을 포함하지 않는다.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
