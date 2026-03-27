/**
 * Elasticsearch 디버그 로그를 실행 가능한 쿼리로 변환하는 유틸리티
 */

/**
 * Lucene 쿼리 문법을 제거하고 ES 쿼리로 변환
 */
export function cleanLuceneQuery(input: string): string {
  let cleaned = input;

  // +, - 연산자를 boolean 쿼리로 변환할 준비
  // 예: +field:value -> must: [{ match: { field: "value" }}]
  cleaned = cleaned.replace(/^\+/gm, '');
  cleaned = cleaned.replace(/^-/gm, '');

  // AND, OR, NOT 를 ES 형식으로 변환
  cleaned = cleaned.replace(/\bAND\b/gi, ',');
  cleaned = cleaned.replace(/\bOR\b/gi, ',');
  cleaned = cleaned.replace(/\bNOT\b/gi, '');

  // 와일드카드 처리
  cleaned = cleaned.replace(/\*/g, '*');

  // 불필요한 공백 정리
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * 디버그 로그에서 JSON 쿼리 부분 추출하기
 */
export function extractJsonFromLog(input: string): string {
  // 중괄호로 시작하고 끝나는 JSON 패턴 찾기
  const jsonPattern = /\{[\s\S]*\}/;
  const match = input.match(jsonPattern);

  if (match) {
    return match[0];
  }

  return input;
}

/**
 * ES 디버그 로그를 정리하여 실행 가능한 쿼리로 변환
 */
export function convertToExecutableQuery(input: string): { query: string; error?: string } {
  try {
    let processed = input.trim();

    // 1. 로그 프리픽스 제거 (타임스탬프, 로그 레벨 등)
    processed = removeLogPrefix(processed);

    // 2. JSON 부분 추출
    processed = extractJsonFromLog(processed);

    // 3. 이스케이프된 따옴표 처리
    processed = processed.replace(/\\"/g, '"');
    processed = processed.replace(/\\\\/g, '\\');

    // 4. Java toString() 형식 정리 (예: Type@hashcode)
    processed = processed.replace(/\w+@[a-f0-9]+/gi, '');

    // 5. Lucene 쿼리 문법 정리
    processed = cleanLuceneSpecificSyntax(processed);

    // 6. JSON 파싱 시도
    try {
      const parsed = JSON.parse(processed);
      return {
        query: JSON.stringify(parsed, null, 2)
      };
    } catch {
      // JSON 파싱 실패 시 기본 정리만 수행
      return {
        query: processed,
        error: 'JSON 파싱에 실패했습니다. 수동으로 확인이 필요할 수 있습니다.'
      };
    }
  } catch (err) {
    return {
      query: input,
      error: `변환 중 오류 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
    };
  }
}

/**
 * 로그 프리픽스 제거
 */
function removeLogPrefix(input: string): string {
  // 일반적인 로그 패턴들 제거
  const patterns = [
    // ISO 타임스탬프: 2024-01-15T10:30:45.123Z
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?\s*/,
    // 일반 타임스탬프: 2024-01-15 10:30:45
    /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(\.\d+)?\s*/,
    // 로그 레벨: [INFO], [DEBUG], [ERROR] 등
    /^\[(INFO|DEBUG|ERROR|WARN|TRACE)\]\s*/i,
    // 로그 레벨 변형: INFO:, DEBUG:
    /^(INFO|DEBUG|ERROR|WARN|TRACE):\s*/i,
    // 클래스명 패턴: c.e.ClassName -
    /^[a-z]\.[a-z]\.[A-Za-z.]+ - /,
    // ES 내부 로그 패턴
    /^\[.*?\]\[.*?\]\[.*?\]\s*/,
  ];

  let result = input;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }

  return result;
}

/**
 * Lucene 특정 문법 정리
 */
function cleanLuceneSpecificSyntax(input: string): string {
  let cleaned = input;

  // boost 문법 제거: field:value^2.0 -> field:value
  cleaned = cleaned.replace(/\^[\d.]+/g, '');

  // 슬롭 제거: "phrase query"~2 -> "phrase query"
  cleaned = cleaned.replace(/"([^"]+)"~\d+/g, '"$1"');

  // 퍼지 검색 제거: term~0.8 -> term
  cleaned = cleaned.replace(/~[\d.]+/g, '');

  // 범위 쿼리 정리 (중괄호/대괄호)
  // 예: {1 TO 10} -> 유지하되 정리
  cleaned = cleaned.replace(/\{\s+/g, '{');
  cleaned = cleaned.replace(/\s+\}/g, '}');

  return cleaned;
}

/**
 * 여러 줄의 Lucene 쿼리를 ES bool 쿼리로 변환
 */
export function luceneToEsBool(luceneQuery: string): string {
  const lines = luceneQuery.split('\n').filter(line => line.trim());
  
  const must: string[] = [];
  const mustNot: string[] = [];
  const should: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('+')) {
      must.push(trimmed.substring(1).trim());
    } else if (trimmed.startsWith('-')) {
      mustNot.push(trimmed.substring(1).trim());
    } else {
      should.push(trimmed);
    }
  }

  const boolQuery: Record<string, unknown> = {
    bool: {}
  };

  if (must.length > 0) {
    (boolQuery.bool as Record<string, unknown>).must = must.map(parseTermToMatch);
  }
  if (mustNot.length > 0) {
    (boolQuery.bool as Record<string, unknown>).must_not = mustNot.map(parseTermToMatch);
  }
  if (should.length > 0) {
    (boolQuery.bool as Record<string, unknown>).should = should.map(parseTermToMatch);
  }

  return JSON.stringify({ query: boolQuery }, null, 2);
}

/**
 * 간단한 term:value 형식을 match 쿼리로 변환
 */
function parseTermToMatch(term: string): Record<string, unknown> {
  const colonIndex = term.indexOf(':');
  
  if (colonIndex > 0) {
    const field = term.substring(0, colonIndex).trim();
    const value = term.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
    
    return {
      match: {
        [field]: value
      }
    };
  }

  // field:value 형식이 아니면 query_string으로 처리
  return {
    query_string: {
      query: term
    }
  };
}
