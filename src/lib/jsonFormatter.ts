/**
 * JSON 포맷팅 유틸리티
 */

export interface FormatResult {
  formatted: string;
  error?: string;
  isValid: boolean;
}

/**
 * NDJSON (줄바꿈으로 구분된 JSON) 감지
 */
function isNDJSON(input: string): boolean {
  const lines = input.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return false;
  
  // 각 줄이 독립적인 JSON 객체/배열인지 확인
  let validCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        validCount++;
      } catch {
        // 파싱 실패
      }
    }
  }
  
  return validCount >= 2 && validCount === lines.length;
}

/**
 * NDJSON 포맷팅
 */
function formatNDJSON(input: string, indent: number = 2): FormatResult {
  const lines = input.trim().split('\n').filter(line => line.trim());
  const formatted: string[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i].trim());
      formatted.push(JSON.stringify(parsed, null, indent));
    } catch (err) {
      errors.push(`줄 ${i + 1}: ${err instanceof Error ? err.message : '파싱 오류'}`);
      formatted.push(lines[i].trim());
    }
  }
  
  return {
    formatted: formatted.join('\n\n'),
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined
  };
}

/**
 * JSON 문자열을 보기 좋게 포맷팅
 */
export function formatJson(input: string, indent: number = 2): FormatResult {
  try {
    const trimmed = input.trim();
    
    if (!trimmed) {
      return {
        formatted: '',
        isValid: false,
        error: '입력값이 비어있습니다.'
      };
    }

    // NDJSON 감지
    if (isNDJSON(trimmed)) {
      return formatNDJSON(trimmed, indent);
    }

    // 먼저 JSON 파싱 시도
    const parsed = JSON.parse(trimmed);
    
    return {
      formatted: JSON.stringify(parsed, null, indent),
      isValid: true
    };
  } catch (err) {
    // 파싱 실패 시 자동 수정 시도
    const fixResult = tryFixJson(input);
    
    if (fixResult.isValid) {
      return fixResult;
    }

    return {
      formatted: input,
      isValid: false,
      error: `JSON 파싱 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
    };
  }
}

/**
 * 손상된 JSON 자동 수정 시도
 */
function tryFixJson(input: string): FormatResult {
  let fixed = input.trim();

  try {
    // 일반적인 문제들 수정

    // 1. 단일 따옴표를 이중 따옴표로 변환
    fixed = fixed.replace(/'/g, '"');

    // 2. 이스케이프되지 않은 줄바꿈 처리
    fixed = fixed.replace(/\n/g, '\\n');
    fixed = fixed.replace(/\r/g, '\\r');
    fixed = fixed.replace(/\t/g, '\\t');

    // 3. 끝에 쉼표가 있는 경우 제거
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // 4. 후행 쉼표 제거
    fixed = fixed.replace(/,\s*}/g, '}');
    fixed = fixed.replace(/,\s*]/g, ']');

    // 5. 누락된 따옴표 추가 (키에)
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

    // 다시 파싱 시도
    const parsed = JSON.parse(fixed);
    
    return {
      formatted: JSON.stringify(parsed, null, 2),
      isValid: true
    };
  } catch {
    return {
      formatted: input,
      isValid: false,
      error: 'JSON 자동 수정에 실패했습니다. 수동으로 확인해주세요.'
    };
  }
}

/**
 * JSON 압축 (한 줄로)
 */
export function minifyJson(input: string): FormatResult {
  try {
    const trimmed = input.trim();
    
    // NDJSON 감지
    if (isNDJSON(trimmed)) {
      const lines = trimmed.split('\n').filter(line => line.trim());
      const minified = lines.map(line => JSON.stringify(JSON.parse(line.trim()))).join('\n');
      return {
        formatted: minified,
        isValid: true
      };
    }
    
    const parsed = JSON.parse(trimmed);
    
    return {
      formatted: JSON.stringify(parsed),
      isValid: true
    };
  } catch (err) {
    return {
      formatted: input,
      isValid: false,
      error: `JSON 파싱 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
    };
  }
}

/**
 * JSON 유효성 검사
 */
export function validateJson(input: string): { isValid: boolean; error?: string } {
  try {
    JSON.parse(input.trim());
    return { isValid: true };
  } catch (err) {
    return {
      isValid: false,
      error: err instanceof Error ? err.message : '알 수 없는 오류'
    };
  }
}

/**
 * JSON 내 특정 경로의 값 추출
 */
export function extractJsonPath(input: string, path: string): string {
  try {
    const parsed = JSON.parse(input.trim());
    const keys = path.split('.');
    
    let current: unknown = parsed;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return `경로를 찾을 수 없음: ${path}`;
      }
    }
    
    if (typeof current === 'object') {
      return JSON.stringify(current, null, 2);
    }
    
    return String(current);
  } catch (err) {
    return `오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`;
  }
}

/**
 * JSON 객체의 키들만 추출
 */
export function extractKeys(input: string): string[] {
  try {
    const parsed = JSON.parse(input.trim());
    
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.keys(parsed);
    }
    
    return [];
  } catch {
    return [];
  }
}

/**
 * JSON 비교 (두 JSON이 같은지)
 */
export function compareJson(json1: string, json2: string): boolean {
  try {
    const parsed1 = JSON.parse(json1.trim());
    const parsed2 = JSON.parse(json2.trim());
    
    return JSON.stringify(parsed1) === JSON.stringify(parsed2);
  } catch {
    return false;
  }
}
