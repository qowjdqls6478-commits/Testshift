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
      // 엔드포인트가 입력에서 추출되지 않았으면 기본 엔드포인트 추가
      let finalOutput = result.query;
      if (!result.endpoint) {
        finalOutput = `GET index/_search\n${result.query}`;
      }
      setOutput(finalOutput);
      if (result.error) {
        setError(result.error);
      }
    } else {
      // Lucene 모드
      const result = luceneToEsBool(input);
      const finalOutput = `GET index/_search\n${result}`;
      setOutput(finalOutput);
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
    <div className="space-y-4">
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
        <button onClick={handleConvert} className="btn-primary ml-auto">
          변환하기
        </button>
      </div>

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
                ? "ES 디버그 로그나 JSON 쿼리를 붙여넣으세요...\n\n예시:\nGET index/_search {\"query\":{\"match\":{\"title\":\"elasticsearch\"}}}"
                : "Lucene 쿼리를 입력하세요...\n\n예시:\n+status:active\n+type:document\n-deleted:true"
            }
            className="text-area h-[calc(100vh-280px)] min-h-[400px]"
          />
        </div>

        {/* 오른쪽: 출력 영역 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-300">
              변환 결과
            </label>
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
            <code>{output || "변환 결과가 여기에 표시됩니다..."}</code>
          </pre>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="p-4 bg-gray-800/50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-2">사용법</h3>
        <p className="text-xs text-gray-400">
          ES 디버그 로그를 붙여넣으면 타임스탬프, 로그 레벨을 자동으로 제거하고 JSON을 추출하여 포맷팅합니다. 
          입력에 <code className="bg-gray-700 px-1 rounded">GET index/_search</code> 가 포함되어 있으면 자동 추출됩니다.
        </p>
      </div>
    </div>
  );
}
