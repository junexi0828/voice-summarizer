import React, { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, Save, Key, Loader2 } from "lucide-react";
import { X } from "lucide-react";

const APISettings = ({ isOpen, onClose, aiServices }) => {
  const [apiKeys, setApiKeys] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [savedMessage, setSavedMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
    }
  }, [isOpen, aiServices]);

  // API 키 불러오기
  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/settings/api-keys');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApiKeys(data.apiKeys || {});
        }
      } else {
        console.error('API 키 로드 실패:', response.statusText);
        // 로드 실패시 로컬스토리지에서 불러오기 (fallback)
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('API 키 로드 중 오류:', error);
      // 오류시 로컬스토리지에서 불러오기 (fallback)
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // 로컬스토리지에서 API 키 불러오기 (fallback)
  const loadFromLocalStorage = () => {
    const savedKeys = {};
    if (aiServices && Array.isArray(aiServices)) {
      aiServices.forEach((service) => {
        const savedKey = localStorage.getItem(`${service.id}_api_key`);
        if (savedKey) {
          savedKeys[service.id] = savedKey;
        }
      });
    }
    setApiKeys(savedKeys);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setValidationErrors({});

      // API 키들을 백엔드 서버에 저장
      const response = await fetch('http://localhost:3001/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKeys }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 성공시 로컬스토리지에도 저장 (fallback용)
        if (apiKeys && typeof apiKeys === "object") {
          Object.entries(apiKeys).forEach(([serviceId, key]) => {
            if (key && key.trim()) {
              localStorage.setItem(`${serviceId}_api_key`, key.trim());
            }
          });
        }
        
        setSavedMessage("API 키가 서버에 저장되었습니다!");
        setTimeout(() => setSavedMessage(""), 3000);
      } else {
        // 서버에서 유효성 검증 오류가 발생한 경우
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
        } else {
          setSavedMessage(`저장 실패: ${data.error || '알 수 없는 오류'}`);
          setTimeout(() => setSavedMessage(""), 3000);
        }
      }
    } catch (error) {
      console.error('API 키 저장 중 오류:', error);
      
      // 네트워크 오류시 로컬스토리지에 저장 (fallback)
      if (apiKeys && typeof apiKeys === "object") {
        Object.entries(apiKeys).forEach(([serviceId, key]) => {
          if (key && key.trim()) {
            localStorage.setItem(`${serviceId}_api_key`, key.trim());
          }
        });
      }
      
      setSavedMessage("네트워크 오류로 로컬에만 저장되었습니다.");
      setTimeout(() => setSavedMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // API 키 형식 검증 함수
  const isValidAPIKey = (serviceId, apiKey) => {
    if (!apiKey || typeof apiKey !== "string") return false;

    const trimmedKey = apiKey.trim();
    if (trimmedKey.length === 0) return false;

    // 서비스별 API 키 형식 검증
    switch (serviceId) {
      case "claude":
        return trimmedKey.startsWith("sk-ant-");
      case "gpt":
        return trimmedKey.startsWith("sk-");
      case "groq":
        return trimmedKey.startsWith("gsk_");
      case "perplexity":
        return trimmedKey.startsWith("pplx-");
      case "gemini":
        return trimmedKey.length > 20; // Google API 키는 일반적으로 길이가 김
      default:
        return trimmedKey.length > 10; // 기본 검증
    }
  };

  // 검증 메시지 함수
  const getValidationMessage = (serviceId) => {
    switch (serviceId) {
      case "claude":
        return 'Claude API 키는 "sk-ant-"로 시작해야 합니다.';
      case "gpt":
        return 'GPT API 키는 "sk-"로 시작해야 합니다.';
      case "groq":
        return 'Groq API 키는 "gsk_"로 시작해야 합니다.';
      case "perplexity":
        return 'Perplexity API 키는 "pplx-"로 시작해야 합니다.';
      case "gemini":
        return "Gemini API 키는 20자 이상이어야 합니다.";
      default:
        return "API 키 형식이 올바르지 않습니다.";
    }
  };

  // API 키 삭제 함수
  const handleDeleteKey = async (serviceId) => {
    const updatedKeys = {
      ...apiKeys,
      [serviceId]: "",
    };
    setApiKeys(updatedKeys);
    localStorage.removeItem(`${serviceId}_api_key`);
    
    // 서버에도 업데이트된 키들을 저장
    try {
      await fetch('http://localhost:3001/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKeys: updatedKeys }),
      });
    } catch (error) {
      console.error('API 키 삭제 중 서버 업데이트 실패:', error);
    }
  };

  const handleKeyChange = (serviceId, value) => {
    setApiKeys((prev) => ({
      ...prev,
      [serviceId]: value,
    }));
  };

  const toggleKeyVisibility = (serviceId) => {
    setShowKeys((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  // Settings 컴포넌트 내에서 사용될 때는 모달 구조를 제거
  if (!isOpen) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Settings size={20} />
          AI 서비스 API 키 설정
        </h3>
      </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-2 text-gray-600">설정을 불러오는 중...</span>
            </div>
          ) : (
            <div className="space-y-6">
            {aiServices &&
              Array.isArray(aiServices) &&
              aiServices.map((service) => (
                <div
                  key={service.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-gray-500" />
                      <input
                        type={showKeys[service.id] ? "text" : "password"}
                        value={apiKeys[service.id] || ""}
                        onChange={(e) =>
                          handleKeyChange(service.id, e.target.value)
                        }
                        placeholder={`${service.name} API 키를 입력하세요`}
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {/* 삭제(X) 버튼 */}
                      {apiKeys[service.id] && (
                        <button
                          onClick={() => handleDeleteKey(service.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                          title="API 키 삭제"
                        >
                          <X size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleKeyVisibility(service.id)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                      >
                        {showKeys[service.id] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>

                    <div className="mt-2 text-xs">
                      {validationErrors[service.id] ? (
                        <p className="text-red-500">
                          ⚠️ {validationErrors[service.id]}
                        </p>
                      ) : (
                        <div className="text-gray-500">
                          {service.id === "claude" && (
                            <p>• Anthropic Console에서 API 키를 발급받으세요</p>
                          )}
                          {service.id === "gpt" && (
                            <p>• OpenAI Platform에서 API 키를 발급받으세요</p>
                          )}
                          {service.id === "groq" && (
                            <p>• Groq Console에서 API 키를 발급받으세요</p>
                          )}
                          {service.id === "perplexity" && (
                            <p>• Perplexity API에서 API 키를 발급받으세요</p>
                          )}
                          {service.id === "gemini" && (
                            <p>• Google AI Studio에서 API 키를 발급받으세요</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {savedMessage && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {savedMessage}
            </div>
          )}

          {/* 안내문구 */}
          <div className="mt-6 text-xs text-gray-500 text-center">
            💾 입력하신 API 키는 <b>서버에 안전하게 저장</b>되며, 로컬에도 백업됩니다.
          </div>

          {/* Settings 컴포넌트 내에서 사용될 때는 저장 버튼 숨김 */}
          {onClose && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSaving}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    저장
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APISettings;
