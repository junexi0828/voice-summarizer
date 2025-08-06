import React, { useState, useEffect } from "react";
import {
  Settings,
  Eye,
  EyeOff,
  Save,
  Key,
  Mail,
  Globe,
  Smartphone,
  Shield,
  FileText,
  Cookie,
  X,
} from "lucide-react";

const APISettings = ({
  isOpen,
  onClose,
  aiServices,
  onNavigateToProductivity,
}) => {
  const [apiKeys, setApiKeys] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [savedMessage, setSavedMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState("api"); // api, services, contact, policies
  const [detailModal, setDetailModal] = useState({
    show: false,
    type: "",
    title: "",
  });

  useEffect(() => {
    // 저장된 API 키 불러오기
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
  }, [aiServices]);

  const handleSave = () => {
    // API 키 유효성 검증
    const errors = {};
    if (apiKeys && typeof apiKeys === "object") {
      Object.entries(apiKeys).forEach(([serviceId, key]) => {
        if (key && key.trim() && !isValidAPIKey(serviceId, key.trim())) {
          errors[serviceId] = getValidationMessage(serviceId);
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // API 키들을 localStorage에 저장
    if (apiKeys && typeof apiKeys === "object") {
      Object.entries(apiKeys).forEach(([serviceId, key]) => {
        if (key && key.trim()) {
          localStorage.setItem(`${serviceId}_api_key`, key.trim());
        }
      });
    }

    setValidationErrors({});
    setSavedMessage("API 키가 저장되었습니다!");
    setTimeout(() => setSavedMessage(""), 3000);
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
  const handleDeleteKey = (serviceId) => {
    setApiKeys((prev) => ({
      ...prev,
      [serviceId]: "",
    }));
    localStorage.removeItem(`${serviceId}_api_key`);
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

  const openDetailModal = (type, title) => {
    setDetailModal({ show: true, type, title });
  };

  const closeDetailModal = () => {
    setDetailModal({ show: false, type: "", title: "" });
  };

  const renderDetailContent = () => {
    switch (detailModal.type) {
      case "privacy":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              개인정보 보호 정책
            </h3>
            <div className="space-y-4 text-gray-700">
              <section>
                <h4 className="font-semibold text-lg mb-2">
                  1. 개인정보 수집 목적
                </h4>
                <p className="text-sm leading-relaxed">
                  EIE Concierge는 서비스 제공을 위해 최소한의 개인정보만을
                  수집합니다. 수집된 정보는 서비스 개선 및 사용자 경험 향상을
                  위한 목적으로만 사용됩니다.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">
                  2. 수집하는 개인정보
                </h4>
                <ul className="text-sm leading-relaxed space-y-1">
                  <li>• API 키 (로컬 저장소에만 저장)</li>
                  <li>• 서비스 이용 기록</li>
                  <li>• 기술적 정보 (브라우저, OS 정보)</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">3. 개인정보 보호</h4>
                <p className="text-sm leading-relaxed">
                  모든 개인정보는 암호화되어 저장되며, 서버로 전송되지 않습니다.
                  사용자의 동의 없이 제3자에게 제공되지 않습니다.
                </p>
              </section>
            </div>
          </div>
        );
      case "terms":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">이용약관</h3>
            <div className="space-y-4 text-gray-700">
              <section>
                <h4 className="font-semibold text-lg mb-2">1. 서비스 이용</h4>
                <p className="text-sm leading-relaxed">
                  EIE Concierge 서비스는 개인 및 비상업적 목적으로만 사용할 수
                  있습니다. 상업적 이용 시 별도 계약이 필요합니다.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">2. 사용자 책임</h4>
                <ul className="text-sm leading-relaxed space-y-1">
                  <li>• API 키의 안전한 관리</li>
                  <li>• 서비스 이용 시 관련 법규 준수</li>
                  <li>• 타인의 권리 침해 금지</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">3. 서비스 제한</h4>
                <p className="text-sm leading-relaxed">
                  서비스 남용, 시스템 장애 유발, 타인에게 피해를 주는 행위는
                  제한될 수 있습니다.
                </p>
              </section>
            </div>
          </div>
        );
      case "cookie":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">쿠키 정책</h3>
            <div className="space-y-4 text-gray-700">
              <section>
                <h4 className="font-semibold text-lg mb-2">
                  1. 쿠키 사용 목적
                </h4>
                <p className="text-sm leading-relaxed">
                  EIE Concierge는 사용자 경험 향상을 위해 최소한의 쿠키만을
                  사용합니다.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">2. 사용하는 쿠키</h4>
                <ul className="text-sm leading-relaxed space-y-1">
                  <li>• 필수 쿠키: 서비스 기본 기능 제공</li>
                  <li>• 성능 쿠키: 서비스 성능 최적화</li>
                  <li>• 기능 쿠키: 사용자 설정 저장</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">3. 쿠키 관리</h4>
                <p className="text-sm leading-relaxed">
                  브라우저 설정에서 쿠키를 비활성화할 수 있으나, 일부 기능이
                  제한될 수 있습니다.
                </p>
              </section>
            </div>
          </div>
        );
      case "voice":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              AI 음성 텍스트 정리
            </h3>
            <div className="space-y-4 text-gray-700">
              <section>
                <h4 className="font-semibold text-lg mb-2">기능 설명</h4>
                <p className="text-sm leading-relaxed">
                  음성 파일을 업로드하면 AI가 자동으로 텍스트로 변환하고, 내용을
                  분석하여 요약 및 정리된 형태로 제공합니다.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">지원 형식</h4>
                <ul className="text-sm leading-relaxed space-y-1">
                  <li>• 오디오 파일: MP3, WAV, M4A</li>
                  <li>• 비디오 파일: MP4, AVI, MOV</li>
                  <li>• 최대 파일 크기: 100MB</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">AI 모델</h4>
                <p className="text-sm leading-relaxed">
                  Claude, GPT, Groq, Perplexity, Gemini 등 다양한 AI 모델을
                  선택하여 사용할 수 있습니다.
                </p>
              </section>
            </div>
          </div>
        );
      case "pomodoro":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              포모도로 타이머
            </h3>
            <div className="space-y-4 text-gray-700">
              <section>
                <h4 className="font-semibold text-lg mb-2">기능 설명</h4>
                <p className="text-sm leading-relaxed">
                  포모도로 기법을 활용한 시간 관리 도구로, 집중 작업과 휴식을
                  체계적으로 관리하여 생산성을 향상시킵니다.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">기본 설정</h4>
                <ul className="text-sm leading-relaxed space-y-1">
                  <li>• 집중 시간: 25분</li>
                  <li>• 짧은 휴식: 5분</li>
                  <li>• 긴 휴식: 15분 (4회 집중 후)</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">추가 기능</h4>
                <ul className="text-sm leading-relaxed space-y-1">
                  <li>• 커스텀 시간 설정</li>
                  <li>• 작업 통계 추적</li>
                  <li>• 알림음 설정</li>
                  <li>• 자동 모드</li>
                </ul>
              </section>
            </div>
          </div>
        );
      case "block":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              집중 모드 차단
            </h3>
            <div className="space-y-4 text-gray-700">
              <section>
                <h4 className="font-semibold text-lg mb-2">기능 설명</h4>
                <p className="text-sm leading-relaxed">
                  집중력 향상을 위해 방해가 되는 웹사이트나 앱을 일시적으로
                  차단하는 기능입니다.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">차단 옵션</h4>
                <ul className="text-sm leading-relaxed space-y-1">
                  <li>• 소셜 미디어 사이트</li>
                  <li>• 엔터테인먼트 사이트</li>
                  <li>• 뉴스 사이트</li>
                  <li>• 커스텀 사이트 추가</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">사용 방법</h4>
                <p className="text-sm leading-relaxed">
                  차단할 사이트를 선택하고 시간을 설정하면, 해당 시간 동안
                  자동으로 차단됩니다.
                </p>
              </section>
            </div>
          </div>
        );
      case "productivity":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              생산성 관리
            </h3>
            <div className="space-y-4 text-gray-700">
              <section>
                <h4 className="font-semibold text-lg mb-2">기능 설명</h4>
                <p className="text-sm leading-relaxed">
                  개인의 작업 패턴과 생산성을 분석하여 효율적인 시간 관리를
                  도와주는 도구입니다.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">추적 항목</h4>
                <ul className="text-sm leading-relaxed space-y-1">
                  <li>• 작업 시간 및 휴식 시간</li>
                  <li>• 완료된 작업 수</li>
                  <li>• 집중도 점수</li>
                  <li>• 생산성 트렌드</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-lg mb-2">분석 리포트</h4>
                <p className="text-sm leading-relaxed">
                  일간, 주간, 월간 리포트를 통해 생산성 패턴을 분석하고 개선
                  방향을 제시합니다.
                </p>
              </section>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderAPISettings = () => (
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
                <h3 className="font-semibold text-gray-800">{service.name}</h3>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-gray-500" />
                <input
                  type={showKeys[service.id] ? "text" : "password"}
                  value={apiKeys[service.id] || ""}
                  onChange={(e) => handleKeyChange(service.id, e.target.value)}
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

      {savedMessage && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {savedMessage}
        </div>
      )}

      {/* 안내문구 */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        ⚠️ 입력하신 API 키는 <b>브라우저(로컬)</b>에만 저장되며, 서버로 전송되지
        않습니다.
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-3">
          EIE Concierge 서비스
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => openDetailModal("voice", "AI 음성 텍스트 정리")}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm">🎤</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">AI 음성 텍스트 정리</h4>
              <p className="text-sm text-gray-600">
                음성을 텍스트로 변환하고 AI로 자동 정리
              </p>
            </div>
          </button>
          <button
            onClick={() => openDetailModal("pomodoro", "포모도로 타이머")}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-sm">⏰</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">포모도로 타이머</h4>
              <p className="text-sm text-gray-600">
                집중력 향상을 위한 시간 관리 도구
              </p>
            </div>
          </button>
          <button
            onClick={() => openDetailModal("block", "집중 모드 차단")}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-sm">🚫</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">집중 모드 차단</h4>
              <p className="text-sm text-gray-600">
                방해 요소를 차단하여 집중력 향상
              </p>
            </div>
          </button>
          <button
            onClick={() => {
              onClose();
              if (onNavigateToProductivity) {
                onNavigateToProductivity();
              }
            }}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-sm">📊</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">생산성 관리</h4>
              <p className="text-sm text-gray-600">개인 생산성 추적 및 분석</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">연락처 정보</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-gray-500" />
            <div>
              <h4 className="font-medium text-gray-800">이메일</h4>
              <a
                href="mailto:junexi0828@gmail.com"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                junexi0828@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe size={20} className="text-gray-500" />
            <div>
              <h4 className="font-medium text-gray-800">웹사이트</h4>
              <a
                href="https://eieconcierge.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                eieconcierge.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone size={20} className="text-gray-500" />
            <div>
              <h4 className="font-medium text-gray-800">Chrome Extension</h4>
              <p className="text-sm text-gray-600">곧 출시 예정</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-3">정책 및 약관</h3>
        <div className="space-y-3">
          <button
            onClick={() => openDetailModal("privacy", "개인정보 보호 정책")}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Shield size={20} className="text-yellow-600" />
            <div>
              <h4 className="font-medium text-gray-800">개인정보 보호 정책</h4>
              <p className="text-sm text-gray-600">
                개인정보 수집 및 이용에 관한 안내
              </p>
            </div>
          </button>
          <button
            onClick={() => openDetailModal("terms", "이용약관")}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <FileText size={20} className="text-yellow-600" />
            <div>
              <h4 className="font-medium text-gray-800">이용약관</h4>
              <p className="text-sm text-gray-600">서비스 이용에 관한 약관</p>
            </div>
          </button>
          <button
            onClick={() => openDetailModal("cookie", "쿠키 정책")}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Cookie size={20} className="text-yellow-600" />
            <div>
              <h4 className="font-medium text-gray-800">쿠키 정책</h4>
              <p className="text-sm text-gray-600">쿠키 사용에 관한 안내</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Settings size={24} />
                설정
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("api")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "api"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                API 설정
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "services"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                서비스
              </button>
              <button
                onClick={() => setActiveTab("contact")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "contact"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                연락처
              </button>
              <button
                onClick={() => setActiveTab("policies")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "policies"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                정책
              </button>
            </div>

            {/* 탭 컨텐츠 */}
            {activeTab === "api" && renderAPISettings()}
            {activeTab === "services" && renderServices()}
            {activeTab === "contact" && renderContact()}
            {activeTab === "policies" && renderPolicies()}

            {/* 하단 버튼 */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                닫기
              </button>
              {activeTab === "api" && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Save size={16} />
                  저장
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 상세 설명 모달 */}
      {detailModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {detailModal.title}
                </h2>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              {renderDetailContent()}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default APISettings;
