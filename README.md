# TextShift

텍스트 포맷 변환 웹 도구 - Elasticsearch 쿼리 변환 및 JSON 포맷팅

## 기능

### 1. ES 쿼리 변환기
- ES 디버그 로그에서 실행 가능한 쿼리 추출
- 타임스탬프, 로그 레벨 등 불필요한 부분 자동 제거
- Lucene 쿼리 문법을 ES bool 쿼리로 변환
- 이스케이프된 JSON 자동 정리

### 2. JSON 포맷터
- 압축된 JSON을 보기 좋게 포맷팅
- JSON 한 줄 압축 (minify)
- JSON 유효성 검사
- 일반적인 JSON 오류 자동 수정
  - 단일 따옴표 → 이중 따옴표
  - 후행 쉼표 제거
  - 따옴표 없는 키 자동 추가

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm run start
```

## Vercel 배포

1. [Vercel](https://vercel.com)에 가입
2. GitHub 레포지토리 연결
3. 자동 배포 완료!

또는 Vercel CLI 사용:

```bash
npm i -g vercel
vercel
```

## 사용 예시

### ES 쿼리 변환

입력:
```
2024-01-15T10:30:45.123Z [DEBUG] {"query":{"match":{"title":"elasticsearch"}}}
```

출력:
```json
{
  "query": {
    "match": {
      "title": "elasticsearch"
    }
  }
}
```

### Lucene to ES Bool

입력:
```
+status:active
+type:document
-deleted:true
```

출력:
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "status": "active" } },
        { "match": { "type": "document" } }
      ],
      "must_not": [
        { "match": { "deleted": "true" } }
      ]
    }
  }
}
```

## 라이선스

MIT
