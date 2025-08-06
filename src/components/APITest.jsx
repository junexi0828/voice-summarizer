import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

// API 기본 URL 설정 - 동적 IP 감지
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

const API_BASE_URL = getApiBaseUrl();

// 서버 데이터 확인을 위한 별도 컴포넌트
const ServerDataItem = ({ itemKey, itemName }) => {
  const [hasData, setHasData] = useState(false);

  // 서버에서 데이터 확인
  useEffect(() => {
    const checkServerData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/${itemKey}`);
        if (response.ok) {
          const data = await response.json();
          setHasData(data.logs && data.logs.length > 0);
        }
      } catch (error) {
        console.error(`서버 데이터 확인 실패: ${itemKey}`, error);
      }
    };
    checkServerData();
  }, [itemKey]);

  const getStatusIcon = (success) => {
    return success ? (
      <CheckCircle className="text-green-500" size={16} />
    ) : (
      <XCircle className="text-red-500" size={16} />
    );
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{itemName}</span>
      <div className="flex items-center gap-2">
        {getStatusIcon(hasData)}
        <span className="text-sm font-medium">
          {hasData ? "데이터 있음" : "데이터 없음"}
        </span>
      </div>
    </div>
  );
};

const APITest = () => {
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState(false);

  const testBackendAPI = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/status`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const testAIAPI = async (serviceName, testUrl) => {
    try {
      const response = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      return { success: true, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    const results = {};

    // 백엔드 API 테스트
    console.log("백엔드 API 테스트 중...");
    results.backend = await testBackendAPI();

    // AI API 테스트
    console.log("AI API 테스트 중...");
    results.claude = await testAIAPI(
      "Claude",
      "https://api.anthropic.com/v1/messages"
    );
    results.gpt = await testAIAPI(
      "GPT",
      "https://api.openai.com/v1/chat/completions"
    );
    results.groq = await testAIAPI(
      "Groq",
      "https://api.groq.com/openai/v1/chat/completions"
    );
    results.perplexity = await testAIAPI(
      "Perplexity",
      "https://api.perplexity.ai/chat/completions"
    );
    results.gemini = await testAIAPI(
      "Gemini",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    );

    setTestResults(results);
    setIsTesting(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const getStatusIcon = (success) => {
    if (success === undefined)
      return <Clock className="text-gray-400" size={16} />;
    return success ? (
      <CheckCircle className="text-green-500" size={16} />
    ) : (
      <XCircle className="text-red-500" size={16} />
    );
  };

  const getStatusText = (success) => {
    if (success === undefined) return "테스트 중...";
    return success ? "연결됨" : "연결 실패";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          API 연결 상태 테스트
        </h1>
        <p className="text-gray-600">모든 API 연결 상태를 확인합니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 백엔드 API */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            백엔드 서버 API
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">서버 상태</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.backend?.success)}
                <span className="text-sm font-medium">
                  {getStatusText(testResults.backend?.success)}
                </span>
              </div>
            </div>
            {testResults.backend?.success && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <p>
                  차단 상태:{" "}
                  {testResults.backend.data?.isBlockingEnabled
                    ? "활성화"
                    : "비활성화"}
                </p>
                <p>
                  총 차단 횟수:{" "}
                  {testResults.backend.data?.blockStats?.totalBlocks || 0}
                </p>
              </div>
            )}
            {testResults.backend?.error && (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                오류: {testResults.backend.error}
              </div>
            )}
          </div>
        </div>

        {/* AI API들 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            AI 서비스 API
          </h3>
          <div className="space-y-3">
            {["claude", "gpt", "groq", "perplexity", "gemini"].map(
              (service) => (
                <div
                  key={service}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600 capitalize">
                    {service}
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults[service]?.success)}
                    <span className="text-sm font-medium">
                      {getStatusText(testResults[service]?.success)}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* 로컬 스토리지 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            로컬 데이터
          </h3>
          <div className="space-y-3">
            {[
              {
                key: "productivity_timer_logs",
                name: "타이머 로그 (localStorage)",
              },
              {
                key: "productivity_block_logs",
                name: "차단 로그 (localStorage)",
              },
              { key: "productivity_work_sessions", name: "작업 세션" },
              { key: "productivity_data", name: "생산성 데이터" },
            ].map((item) => {
              const data = localStorage.getItem(item.key);
              const hasData = data && JSON.parse(data).length > 0;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(hasData)}
                    <span className="text-sm font-medium">
                      {hasData ? "데이터 있음" : "데이터 없음"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 서버 로그 데이터 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            서버 로그 데이터
          </h3>
          <div className="space-y-3">
            {[
              { key: "timer-logs", name: "타이머 로그 (서버)" },
              { key: "block-logs", name: "차단 로그 (서버)" },
            ].map((item) => (
              <ServerDataItem
                key={item.key}
                itemKey={item.key}
                itemName={item.name}
              />
            ))}
          </div>
        </div>

        {/* API 키 설정 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            API 키 설정
          </h3>
          <div className="space-y-3">
            {["claude", "gpt", "groq", "perplexity", "gemini"].map(
              (service) => {
                const apiKey = localStorage.getItem(`${service}_api_key`);
                const hasKey = apiKey && apiKey.length > 0;
                return (
                  <div
                    key={service}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-600 capitalize">
                      {service}
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(hasKey)}
                      <span className="text-sm font-medium">
                        {hasKey ? "설정됨" : "미설정"}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={runAllTests}
          disabled={isTesting}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isTesting ? (
            <>
              <Clock className="animate-spin" size={16} />
              테스트 중...
            </>
          ) : (
            <>
              <AlertTriangle size={16} />
              다시 테스트
            </>
          )}
        </button>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">테스트 결과 해석</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>
            • <strong>백엔드 서버</strong>: 차단 기능과 알고리즘 문제 시스템
          </li>
          <li>
            • <strong>AI API</strong>: 음성 텍스트 정리 및 AI 분석 기능
          </li>
          <li>
            • <strong>로컬 데이터</strong>: 생산성 관리 시스템의 데이터 저장
          </li>
          <li>
            • <strong>API 키</strong>: AI 서비스 사용을 위한 인증 키
          </li>
        </ul>
      </div>
    </div>
  );
};

export default APITest;
