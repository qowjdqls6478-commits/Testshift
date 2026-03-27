"use client";

import { useState } from "react";
import { formatJson, minifyJson, validateJson } from "@/lib/jsonFormatter";

type FormatAction = "format" | "minify" | "validate";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);

  const handleAction = (action: FormatAction) => {
    if (!input.trim()) {
      setError("입력값을 넣어주세요.");
      setOutput("");
      setValidationResult(null);
      return;
    }

    setError(null);
    setValidationResult(null);

    switch (action) {
      case "format": {
        const result = formatJson(input, indent);
        setOutput(result.formatted);
        if (!result.isValid && result.error) {
          setError(result.error);
        }
        break;
      }
      case "minify": {
        const result = minifyJson(input);
        setOutput(result.formatted);
        if (!result.isValid && result.error) {
          setError(result.error);
        }
        break;
      }
      case "validate": {
        const result = validateJson(input);
        setValidationResult({
          isValid: result.isValid,
          message: result.isValid
            ? "유효한 JSON입니다!"
            : `유효하지 않은 JSON: ${result.error}`,
        });
        break;
      }
    }
  };

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setValidationResult(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      setError("클립보드 접근 권한이 필요합니다.");
    }
  };

  return (
    <div className="space-y-4">
      {/* 설정 및 버튼 */}
      <div className="flex gap-4 items-center flex-wrap">
        <span className="text-gray-400 text-sm">들여쓰기:</span>
        <select
          value={indent}
          onChange={(e) => setIndent(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
        >
          <option value={2}>2칸</option>
          <option value={4}>4칸</option>
          <option value={8}>8칸</option>
        </select>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => handleAction("format")} className="btn-primary">
            포맷팅
          </button>
          <button onClick={() => handleAction("minify")} className="btn-secondary">
            압축
          </button>
          <button onClick={() => handleAction("validate")} className="btn-secondary">
            유효성 검사
          </button>
        </div>
      </div>

      {/* 유효성 검사 결과 */}
      {validationResult && (
        <div
          className={`p-3 rounded-lg text-sm ${
            validationResult.isValid
              ? "bg-green-900/30 border border-green-700 text-green-300"
              : "bg-red-900/30 border border-red-700 text-red-300"
          }`}
        >
          {validationResult.isValid ? "✓" : "✗"} {validationResult.message}
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* 좌우 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 왼쪽: 입력 영역 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-300">JSON 입력</label>
            <div className="flex gap-2">
              <button
                onClick={handlePaste}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                붙여넣기
              </button>
              <button
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'JSON을 입력하세요...\n\n예시:\n{"name":"TextShift","version":"1.0","features":["es-query","json-format"]}'}
            className="text-area h-[calc(100vh-280px)] min-h-[400px]"
          />
        </div>

        {/* 오른쪽: 출력 영역 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-300">결과</label>
            {output && (
              <button
                onClick={handleCopy}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    복사됨
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    복사
                  </>
                )}
              </button>
            )}
          </div>
          <pre className="text-area h-[calc(100vh-280px)] min-h-[400px] overflow-auto whitespace-pre-wrap">
            <code>{output || "결과가 여기에 표시됩니다..."}</code>
          </pre>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="p-4 bg-gray-800/50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-2">사용법</h3>
        <p className="text-xs text-gray-400">
          JSON을 붙여넣고 포맷팅/압축/유효성 검사를 수행합니다. 단일 따옴표, 후행 쉼표 등 일부 오류는 자동 수정됩니다.
        </p>
      </div>
    </div>
  );
}
