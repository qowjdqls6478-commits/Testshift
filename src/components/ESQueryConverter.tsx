"use client";

import { useState } from "react";
import { convertToExecutableQuery, luceneToEsBool } from "@/lib/esQueryConverter";

type ConversionMode = "auto" | "lucene";

export default function ESQueryConverter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ConversionMode>("auto");
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    if (!input.trim()) {
      setError("입력값을 넣어주세요.");
      setOutput("");
      return;
    }

    setError(null);

    if (mode === "auto") {
      const result = convertToExecutableQuery(input);
      setOutput(result.query);
      if (result.error) {
        setError(result.error);
      }
    } else {
      // Lucene 모드
      const result = luceneToEsBool(input);
      setOutput(result);
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
  };

  return (
    <div className="space-y-6">
      {/* 모드 선택 */}
      <div className="flex gap-4 items-center">
        <span className="text-gray-400 text-sm">변환 모드:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="auto"
            checked={mode === "auto"}
            onChange={() => setMode("auto")}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm">자동 감지</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="lucene"
            checked={mode === "lucene"}
            onChange={() => setMode("lucene")}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm">Lucene → ES Bool</span>
        </label>
      </div>

      {/* 입력 영역 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-300">
            입력 (디버그 로그 또는 쿼리)
          </label>
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            초기화
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === "auto"
              ? "ES 디버그 로그나 JSON 쿼리를 붙여넣으세요...\n\n예시:\n2024-01-15T10:30:45.123Z [DEBUG] {\"query\":{\"match\":{\"title\":\"elasticsearch\"}}}"
              : "Lucene 쿼리를 입력하세요...\n\n예시:\n+status:active\n+type:document\n-deleted:true\ntitle:elasticsearch"
          }
          className="text-area"
          rows={10}
        />
      </div>

      {/* 변환 버튼 */}
      <div className="flex gap-3">
        <button onClick={handleConvert} className="btn-primary">
          변환하기
        </button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* 출력 영역 */}
      {output && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-300">
              변환 결과
            </label>
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
          </div>
          <pre className="text-area overflow-auto whitespace-pre-wrap">
            <code>{output}</code>
          </pre>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-3">사용법</h3>
        <ul className="text-xs text-gray-400 space-y-2">
          <li>
            <strong className="text-gray-300">자동 감지 모드:</strong> ES 디버그 로그를 붙여넣으면 타임스탬프, 로그 레벨을 자동으로 제거하고 JSON을 추출하여 포맷팅합니다.
          </li>
          <li>
            <strong className="text-gray-300">Lucene → ES Bool 모드:</strong> Lucene 쿼리 문법(+, -, AND, OR)을 ES bool 쿼리로 변환합니다.
          </li>
          <li>
            <strong className="text-gray-300">지원 형식:</strong> 이스케이프된 JSON, Java toString() 형식, Lucene boost/fuzzy 문법 등을 자동으로 정리합니다.
          </li>
        </ul>
      </div>
    </div>
  );
}
