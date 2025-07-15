import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Save, Key } from 'lucide-react';
import { X } from 'lucide-react';

const APISettings = ({ isOpen, onClose, aiServices }) => {
    const [apiKeys, setApiKeys] = useState({});
    const [showKeys, setShowKeys] = useState({});
    const [savedMessage, setSavedMessage] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        // 저장된 API 키 불러오기
        const savedKeys = {};
        aiServices.forEach(service => {
            const savedKey = localStorage.getItem(`${service.id}_api_key`);
            if (savedKey) {
                savedKeys[service.id] = savedKey;
            }
        });
        setApiKeys(savedKeys);
    }, [aiServices]);

    const handleSave = () => {
        // API 키 유효성 검증
        const errors = {};
        Object.entries(apiKeys).forEach(([serviceId, key]) => {
            if (key.trim() && !isValidAPIKey(serviceId, key.trim())) {
                errors[serviceId] = getValidationMessage(serviceId);
            }
        });

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        // API 키들을 localStorage에 저장
        Object.entries(apiKeys).forEach(([serviceId, key]) => {
            if (key.trim()) {
                localStorage.setItem(`${serviceId}_api_key`, key.trim());
            }
        });

        setValidationErrors({});
        setSavedMessage('API 키가 저장되었습니다!');
        setTimeout(() => setSavedMessage(''), 3000);
    };

    // API 키 형식 검증 함수
    const isValidAPIKey = (serviceId, apiKey) => {
        if (!apiKey || typeof apiKey !== 'string') return false;

        const trimmedKey = apiKey.trim();
        if (trimmedKey.length === 0) return false;

        // 서비스별 API 키 형식 검증
        switch (serviceId) {
            case 'claude':
                return trimmedKey.startsWith('sk-ant-');
            case 'gpt':
                return trimmedKey.startsWith('sk-');
            case 'groq':
                return trimmedKey.startsWith('gsk_');
            case 'perplexity':
                return trimmedKey.startsWith('pplx-');
            case 'gemini':
                return trimmedKey.length > 20; // Google API 키는 일반적으로 길이가 김
            default:
                return trimmedKey.length > 10; // 기본 검증
        }
    };

    // 검증 메시지 함수
    const getValidationMessage = (serviceId) => {
        switch (serviceId) {
            case 'claude':
                return 'Claude API 키는 "sk-ant-"로 시작해야 합니다.';
            case 'gpt':
                return 'GPT API 키는 "sk-"로 시작해야 합니다.';
            case 'groq':
                return 'Groq API 키는 "gsk_"로 시작해야 합니다.';
            case 'perplexity':
                return 'Perplexity API 키는 "pplx-"로 시작해야 합니다.';
            case 'gemini':
                return 'Gemini API 키는 20자 이상이어야 합니다.';
            default:
                return 'API 키 형식이 올바르지 않습니다.';
        }
    };

    // API 키 삭제 함수
    const handleDeleteKey = (serviceId) => {
        setApiKeys(prev => ({
            ...prev,
            [serviceId]: ''
        }));
        localStorage.removeItem(`${serviceId}_api_key`);
    };

    const handleKeyChange = (serviceId, value) => {
        setApiKeys(prev => ({
            ...prev,
            [serviceId]: value
        }));
    };

    const toggleKeyVisibility = (serviceId) => {
        setShowKeys(prev => ({
            ...prev,
            [serviceId]: !prev[serviceId]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Settings size={24} />
                            AI 서비스 API 키 설정
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-6">
                        {aiServices.map((service) => (
                            <div key={service.id} className="border border-gray-200 rounded-lg p-4">
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
                                            value={apiKeys[service.id] || ''}
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
                                            {showKeys[service.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>

                                    <div className="mt-2 text-xs">
                                        {validationErrors[service.id] ? (
                                            <p className="text-red-500">⚠️ {validationErrors[service.id]}</p>
                                        ) : (
                                            <div className="text-gray-500">
                                                {service.id === 'claude' && (
                                                    <p>• Anthropic Console에서 API 키를 발급받으세요</p>
                                                )}
                                                {service.id === 'gpt' && (
                                                    <p>• OpenAI Platform에서 API 키를 발급받으세요</p>
                                                )}
                                                {service.id === 'groq' && (
                                                    <p>• Groq Console에서 API 키를 발급받으세요</p>
                                                )}
                                                {service.id === 'perplexity' && (
                                                    <p>• Perplexity API에서 API 키를 발급받으세요</p>
                                                )}
                                                {service.id === 'gemini' && (
                                                    <p>• Google AI Studio에서 API 키를 발급받으세요</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {savedMessage && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                            {savedMessage}
                        </div>
                    )}

                    {/* 안내문구 */}
                    <div className="mt-6 text-xs text-gray-500 text-center">
                        ⚠️ 입력하신 API 키는 <b>브라우저(로컬)</b>에만 저장되며, 서버로 전송되지 않습니다.
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Save size={16} />
                            저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default APISettings;