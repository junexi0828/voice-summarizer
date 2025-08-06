import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Chrome API 사용 가능 여부 확인 함수
const isChromeExtensionAvailable = () => {
    return typeof window !== 'undefined' &&
        typeof window.chrome !== 'undefined' &&
        window.chrome.runtime &&
        window.chrome.runtime.id;
};

export const AuthProvider = ({ children }) => {
    const [selectedAIService, setSelectedAIService] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Chrome API 사용 가능 여부 확인
    const isChromeExtension = isChromeExtensionAvailable();

    // AI 서비스 목록
    const aiServices = [
        {
            id: 'claude',
            name: 'Claude (Anthropic)',
            description: 'Anthropic의 Claude AI',
            icon: '🤖',
            color: 'bg-purple-500'
        },
        {
            id: 'gpt',
            name: 'GPT (OpenAI)',
            description: 'OpenAI의 GPT 모델',
            icon: '🧠',
            color: 'bg-green-500'
        },
        {
            id: 'groq',
            name: 'Groq',
            description: '고속 추론 AI',
            icon: '⚡',
            color: 'bg-blue-500'
        },
        {
            id: 'perplexity',
            name: 'Perplexity',
            description: '실시간 정보 검색 AI',
            icon: '🔍',
            color: 'bg-orange-500'
        },
        {
            id: 'gemini',
            name: 'Gemini (Google)',
            description: 'Google의 Gemini AI',
            icon: '🌟',
            color: 'bg-yellow-500'
        }
    ];

    useEffect(() => {
        // 저장된 AI 서비스 선택 확인
        if (isChromeExtension) {
            try {
                window.chrome.storage.local.get(['selectedAIService'], (result) => {
                    if (result.selectedAIService) {
                        setSelectedAIService(result.selectedAIService);
                    }
                    setIsLoading(false);
                });
            } catch (error) {
                console.error('Chrome storage error:', error);
                setIsLoading(false);
            }
        } else {
            // 개발 환경에서는 localStorage 사용
            try {
                const savedService = localStorage.getItem('selectedAIService');
                if (savedService) {
                    setSelectedAIService(JSON.parse(savedService));
                }
            } catch (error) {
                console.error('localStorage error:', error);
            } finally {
                setIsLoading(false);
            }
        }
    }, [isChromeExtension]);

    const selectAIService = (serviceId) => {
        const service = aiServices.find(s => s.id === serviceId);
        setSelectedAIService(service);

        if (isChromeExtension) {
            try {
                window.chrome.storage.local.set({ selectedAIService: service });
            } catch (error) {
                console.error('Chrome storage set error:', error);
            }
        } else {
            try {
                localStorage.setItem('selectedAIService', JSON.stringify(service));
            } catch (error) {
                console.error('localStorage set error:', error);
            }
        }
    };

    const value = {
        isLoading,
        selectedAIService,
        selectAIService,
        aiServices,
        isChromeExtension
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};