import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAIService, setSelectedAIService] = useState(null);

    // Chrome API 사용 가능 여부 확인
    const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

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
        // 저장된 사용자 정보 확인
        if (isChromeExtension) {
            chrome.storage.local.get(['user', 'selectedAIService'], (result) => {
                if (result.user) {
                    setUser(result.user);
                }
                if (result.selectedAIService) {
                    setSelectedAIService(result.selectedAIService);
                }
                setIsLoading(false);
            });
        } else {
            // 개발 환경에서는 localStorage 사용
            const savedUser = localStorage.getItem('user');
            const savedService = localStorage.getItem('selectedAIService');

            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
            if (savedService) {
                setSelectedAIService(JSON.parse(savedService));
            }
            setIsLoading(false);
        }
    }, [isChromeExtension]);

    const signInWithGoogle = async () => {
        try {
            if (!isChromeExtension) {
                // 개발 환경에서는 모의 로그인
                const mockUser = {
                    id: 'dev-user-123',
                    email: 'dev@example.com',
                    name: '개발자',
                    picture: 'https://via.placeholder.com/40',
                    provider: 'google'
                };
                setUser(mockUser);
                localStorage.setItem('user', JSON.stringify(mockUser));
                return mockUser;
            }

            // Chrome Identity API를 사용한 Google 로그인
            const token = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response.token);
                    }
                });
            });

            // Google 사용자 정보 가져오기
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(res => res.json());

            const userData = {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                provider: 'google'
            };

            setUser(userData);
            chrome.storage.local.set({ user: userData });

            return userData;
        } catch (error) {
            console.error('Google 로그인 오류:', error);
            throw error;
        }
    };

    const signOut = () => {
        setUser(null);
        setSelectedAIService(null);

        if (isChromeExtension) {
            chrome.storage.local.remove(['user', 'selectedAIService']);

            // Google 로그아웃
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (token) {
                    chrome.identity.removeCachedAuthToken({ token }, () => {
                        console.log('로그아웃 완료');
                    });
                }
            });
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('selectedAIService');
        }
    };

    const selectAIService = (serviceId) => {
        const service = aiServices.find(s => s.id === serviceId);
        setSelectedAIService(service);

        if (isChromeExtension) {
            chrome.storage.local.set({ selectedAIService: service });
        } else {
            localStorage.setItem('selectedAIService', JSON.stringify(service));
        }
    };

    const value = {
        user,
        isLoading,
        signInWithGoogle,
        signOut,
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