/**
 * JSON 포맷팅 유틸리티
 */

export interface FormatResult {
  formatted: string;
  error?: string;
  isValid: boolean;
}

/**
 * 연속된 JSON 객체들 분리 (}{로 붙어있는 경우)
 */
function splitConcatenatedJson(input: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let start = 0;
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (char === '\\') {
      escape = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{' || char === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (char === '}' || char === ']') {
      depth--;
      if (depth === 0) {
        results.push(input.slice(start, i + 1));
      }
    }
  }
  
  return results;
}

/**
 * 여러 JSON 감지 (줄바꿈 또는 연속)
 */
function isMultipleJson(input: string): boolean {
  // 줄바꿈으로 구분된 경우
  const lines = input.trim().split('\n').filter(line => line.trim());
  if (lines.length >= 2) {
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
    if (validCount >= 2 && validCount === lines.length) return true;
  }
  
  // 연속으로 붙어있는 경우 (}{)
  const trimmed = input.trim();
  if (trimmed.includes('}{') || trimmed.includes('][')) {
    const parts = splitConcatenatedJson(trimmed);
    if (parts.length >= 2) {
      let validCount = 0;
      for (const part of parts) {
        try {
          JSON.parse(part);
          validCount++;
        } catch {
          // 파싱 실패
        }
      }
      if (validCount >= 2) return true;
    }
  }
  
  return false;
}

/**
 * 여러 JSON 포맷팅
 */
function formatMultipleJson(input: string, indent: number = 2): FormatResult {
  const trimmed = input.trim();
  let parts: string[] = [];
  
  // 줄바꿈으로 구분된 경우
  const lines = trimmed.split('\n').filter(line => line.trim());
  if (lines.length >= 2) {
    let allValid = true;
    for (const line of lines) {
      try {
        JSON.parse(line.trim());
      } catch {
        allValid = false;
        break;
      }
    }
    if (allValid) {
      parts = lines.map(l => l.trim());
    }
  }
  
  // 연속으로 붙어있는 경우
  if (parts.length === 0) {
    parts = splitConcatenatedJson(trimmed);
  }
  
  const formatted: string[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    try {
      const parsed = JSON.parse(parts[i]);
      formatted.push(JSON.stringify(parsed, null, indent));
    } catch (err) {
      errors.push(`JSON ${i + 1}: ${err instanceof Error ? err.message : '파싱 오류'}`);
      formatted.push(parts[i]);
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

    // 여러 JSON 감지 (줄바꿈 또는 연속)
    if (isMultipleJson(trimmed)) {
      return formatMultipleJson(trimmed, indent);
    }

    // 먼저 JSON 파싱 시도
    const parsed = JSON.parse(trimmed);
    
    return {
      formatted: JSON.stringify(parsed, null, indent),
      isValid: true
    };
  } catch (err) {
    // 파싱 실패 시 여러 JSON인지 다시 확인
    if (isMultipleJson(input.trim())) {
      return formatMultipleJson(input.trim(), indent);
    }
    
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
    
    // 여러 JSON 감지
    if (isMultipleJson(trimmed)) {
      // 줄바꿈으로 구분된 경우
      const lines = trimmed.split('\n').filter(line => line.trim());
      let parts: string[] = [];
      
      let allValid = true;
      for (const line of lines) {
        try {
          JSON.parse(line.trim());
        } catch {
          allValid = false;
          break;
        }
      }
      
      if (allValid && lines.length >= 2) {
        parts = lines.map(l => l.trim());
      } else {
        // 연속으로 붙어있는 경우
        parts = splitConcatenatedJson(trimmed);
      }
      
      const minified = parts.map(part => JSON.stringify(JSON.parse(part))).join('\n');
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
    // 파싱 실패 시 여러 JSON인지 다시 확인
    if (isMultipleJson(input.trim())) {
      const parts = splitConcatenatedJson(input.trim());
      try {
        const minified = parts.map(part => JSON.stringify(JSON.parse(part))).join('\n');
        return {
          formatted: minified,
          isValid: true
        };
      } catch {
        // 무시
      }
    }
    
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
