import React, { useState, useEffect } from "react";

const AlgorithmProblemModal = ({
  isOpen,
  onClose,
  problem,
  onSubmit,
  testResults = null,
  isSubmitting = false,
}) => {
  const [code, setCode] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (problem && isOpen) {
      // 기본 코드 템플릿 제공
      setCode(`# ${problem.title}
# ${problem.description}

def solve():
    # 여기에 코드를 작성하세요
    pass

if __name__ == "__main__":
    solve()
`);
      setShowSolution(false);
    }
  }, [problem, isOpen]);

  const handleSubmit = () => {
    if (code.trim()) {
      onSubmit(code);
    }
  };

  const handleShowSolution = () => {
    setShowSolution(true);
  };

  if (!isOpen || !problem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                🧮 알고리즘 문제 풀이
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                차단 해제를 위해 이 문제를 풀어주세요
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 문제 설명 */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {problem.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    problem.difficulty === "EASY"
                      ? "bg-green-100 text-green-800"
                      : problem.difficulty === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {problem.difficulty}
                </span>
                {problem.platform && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {problem.platform}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">문제 설명</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {problem.description}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">태그</h4>
                <div className="flex flex-wrap gap-1">
                  {problem.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  테스트 케이스
                </h4>
                <div className="space-y-2">
                  {problem.testCases.map((testCase, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="text-sm">
                        <strong>입력:</strong> {testCase.input}
                      </div>
                      <div className="text-sm">
                        <strong>출력:</strong> {testCase.output}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleShowSolution}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                💡 정답 보기
              </button>
            </div>

            {showSolution && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">정답 코드</h4>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                  <code>{problem.solution}</code>
                </pre>
              </div>
            )}
          </div>

          {/* 코드 에디터 */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">코드 작성</h4>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-64 p-3 border rounded-lg font-mono text-sm resize-none"
                placeholder="여기에 코드를 작성하세요..."
              />
            </div>

            {/* 테스트 결과 */}
            {testResults && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">테스트 결과</h4>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded text-sm ${
                        result.passed
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={
                            result.passed ? "text-green-600" : "text-red-600"
                          }
                        >
                          {result.passed ? "✓" : "✗"}
                        </span>
                        <span className="font-medium">
                          테스트 케이스 {index + 1}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>입력: {result.input}</div>
                        <div>기대: {result.expected}</div>
                        <div>실제: {result.actual}</div>
                        {result.error && (
                          <div className="text-red-600">
                            오류: {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !code.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  isSubmitting || !code.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isSubmitting ? "제출 중..." : "제출하기"}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmProblemModal;
