import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Save, Key } from 'lucide-react';

const APISettings = ({ isOpen, onClose, aiServices }) => {
    const [apiKeys, setApiKeys] = useState({});
    const [showKeys, setShowKeys] = useState({});
    const [savedMessage, setSavedMessage] = useState('');

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
        // API 키들을 localStorage에 저장
        Object.entries(apiKeys).forEach(([serviceId, key]) => {
            if (key.trim()) {
                localStorage.setItem(`${serviceId}_api_key`, key.trim());
            }
        });

        setSavedMessage('API 키가 저장되었습니다!');
        setTimeout(() => setSavedMessage(''), 3000);
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
                                        <button
                                            onClick={() => toggleKeyVisibility(service.id)}
                                            className="p-2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showKeys[service.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>

                                    <div className="mt-2 text-xs text-gray-500">
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
                                </div>
                            </div>
                        ))}
                    </div>

                    {savedMessage && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                            {savedMessage}
                        </div>
                    )}

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