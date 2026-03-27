"use client";

import { useState } from "react";
import ESQueryConverter from "@/components/ESQueryConverter";
import JsonFormatter from "@/components/JsonFormatter";

type Tab = "es-query" | "json-format";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("es-query");

  return (
    <main className="min-h-screen">
      {/* 헤더 */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white">
            TextShift
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            텍스트 포맷 변환기 - ES 쿼리 & JSON 포맷팅
          </p>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("es-query")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "es-query"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              ES 쿼리 변환
            </button>
            <button
              onClick={() => setActiveTab("json-format")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "json-format"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              JSON 포맷터
            </button>
          </div>
        </div>
      </nav>

      {/* 콘텐츠 영역 */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === "es-query" && <ESQueryConverter />}
        {activeTab === "json-format" && <JsonFormatter />}
      </div>

      {/* 푸터 */}
      <footer className="border-t border-gray-800 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <p className="text-gray-500 text-xs text-center">
            TextShift - Elasticsearch 디버그 로그를 실행 가능한 쿼리로 변환
          </p>
        </div>
      </footer>
    </main>
  );
}
