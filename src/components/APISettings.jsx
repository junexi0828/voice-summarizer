import React, { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, Save, Key, X, Loader2 } from "lucide-react";

const APISettings = ({ isOpen, onClose, aiServices }) => {
  const [apiKeys, setApiKeys] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // API 키 로드
  const loadApiKeys = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings.apiKeys) {
          setApiKeys(data.settings.apiKeys);
        }
      }
    } catch (error) {
      console.error("API 키 로드 실패:", error);
    }
  };

  // 로컬 스토리지에서 로드
  const loadFromLocalStorage = () => {
    try {
      const savedKeys = localStorage.getItem("apiKeys");
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
    } catch (error) {
      console.error("로컬 스토리지 로드 실패:", error);
    }
  };

  // 저장
  const handleSave = async () => {
    setIsSaving(true);
    setSavedMessage("");

    try {
      // 서버에 저장
      const response = await fetch(
        "http://localhost:3001/api/settings/api-keys",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKeys }),
        }
      );

      if (response.ok) {
        // 로컬에도 저장
        localStorage.setItem("apiKeys", JSON.stringify(apiKeys));
        setSavedMessage("✅ API 키가 성공적으로 저장되었습니다!");
        setTimeout(() => setSavedMessage(""), 3000);
      } else {
        setSavedMessage("❌ 저장에 실패했습니다.");
        setTimeout(() => setSavedMessage(""), 3000);
      }
    } catch (error) {
      console.error("저장 실패:", error);
      setSavedMessage("❌ 저장 중 오류가 발생했습니다.");
      setTimeout(() => setSavedMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // API 키 유효성 검사
  const isValidAPIKey = (serviceId, apiKey) => {
    if (!apiKey || apiKey.trim() === "") return true; // 빈 값은 허용

    const patterns = {
      claude: /^sk-ant-[a-zA-Z0-9]{48}$/,
      gpt: /^sk-[a-zA-Z0-9]{48}$/,
      groq: /^gsk_[a-zA-Z0-9]{48}$/,
      perplexity: /^pplx-[a-zA-Z0-9]{48}$/,
      gemini: /^AIza[a-zA-Z0-9]{35}$/,
    };

    const pattern = patterns[serviceId];
    return pattern ? pattern.test(apiKey) : true;
  };

  // 유효성 검사 메시지
  const getValidationMessage = (serviceId) => {
    const messages = {
      claude: "Claude API 키는 'sk-ant-'로 시작하는 48자 문자열이어야 합니다.",
      gpt: "OpenAI API 키는 'sk-'로 시작하는 48자 문자열이어야 합니다.",
      groq: "Groq API 키는 'gsk_'로 시작하는 48자 문자열이어야 합니다.",
      perplexity:
        "Perplexity API 키는 'pplx-'로 시작하는 48자 문자열이어야 합니다.",
      gemini: "Gemini API 키는 'AIza'로 시작하는 39자 문자열이어야 합니다.",
    };
    return messages[serviceId] || "올바른 API 키 형식이 아닙니다.";
  };

  // API 키 삭제
  const handleDeleteKey = async (serviceId) => {
    const newApiKeys = { ...apiKeys };
    delete newApiKeys[serviceId];
    setApiKeys(newApiKeys);
    setValidationErrors({ ...validationErrors, [serviceId]: null });
  };

  // API 키 변경
  const handleKeyChange = (serviceId, value) => {
    const newApiKeys = { ...apiKeys, [serviceId]: value };
    setApiKeys(newApiKeys);

    // 유효성 검사
    if (!isValidAPIKey(serviceId, value)) {
      setValidationErrors({
        ...validationErrors,
        [serviceId]: getValidationMessage(serviceId),
      });
    } else {
      setValidationErrors({
        ...validationErrors,
        [serviceId]: null,
      });
    }
  };

  // 키 표시/숨김 토글
  const toggleKeyVisibility = (serviceId) => {
    setShowKeys({ ...showKeys, [serviceId]: !showKeys[serviceId] });
  };

  // 초기 로드
  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
      loadFromLocalStorage();
      setIsLoading(false);
    }
  }, [isOpen]);

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

      <div className="mt-6 text-xs text-gray-500 text-center">
        💾 입력하신 API 키는 <b>서버에 안전하게 저장</b>되며, 로컬에도
        백업됩니다.
      </div>

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
  );
};

export default APISettings;
