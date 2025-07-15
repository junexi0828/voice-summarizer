import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, FileText, Copy, RotateCcw, Volume2, Loader2, LogIn, LogOut, Settings, Key } from 'lucide-react';
import { useAuth } from './AuthProvider';
import AIServiceManager from './AIServiceManager';
import APISettings from './APISettings';

const VoiceTextSummarizer = () => {
    const {
        user,
        signInWithGoogle,
        signOut,
        selectedAIService,
        selectAIService,
        aiServices,
        isChromeExtension
    } = useAuth();

    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState('');
    const [summarizedText, setSummarizedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [error, setError] = useState('');
    const [lang, setLang] = useState('ko-KR');
    const [showAIServiceSelector, setShowAIServiceSelector] = useState(false);
    const [showAPISettings, setShowAPISettings] = useState(false);

    const recognitionRef = useRef(null);

    useEffect(() => {
        // Web Speech API 지원 확인
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setIsSpeechSupported(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();

            // 정확도 향상을 위한 설정 (실시간성 주석처리)
            recognitionRef.current.continuous = true;      // 연속 인식
            recognitionRef.current.interimResults = false; // 중간 결과 무시
            recognitionRef.current.lang = lang;
            recognitionRef.current.maxAlternatives = 1; // 가장 정확한 결과만 사용

            recognitionRef.current.onresult = (event) => {
                // 실시간성을 완전히 차단하고 최종 결과만 처리
                if (event.results.length > 0) {
                    const result = event.results[event.results.length - 1]; // 마지막 결과만 사용

                    // isFinal이 true인 경우만 처리 (최종 결과만)
                    if (result.isFinal) {
                        const transcript = result[0].transcript;
                        const confidence = result[0].confidence;

                        // 영어일 때만 신뢰도 체크
                        if (lang.startsWith('en')) {
                            if (typeof confidence === 'number' && confidence < 0.9) {
                                setError(`Speech recognition confidence is low (${(confidence * 100).toFixed(1)}%). Please try again.`);
                            }
                        }

                        setTranscribedText(prev => prev + transcript + ' ');
                        console.log('최종 결과만 처리됨:', transcript);
                    } else {
                        console.log('중간 결과 무시됨');
                    }
                }
            };

            recognitionRef.current.onerror = (event) => {
                setError(`음성 인식 오류: ${event.error}`);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, [lang]);

    const startRecording = () => {
        if (!isSpeechSupported) {
            setError('이 브라우저에서는 음성 인식이 지원되지 않습니다.');
            return;
        }
        if (isRecording) {
            setError('이미 녹음이 진행 중입니다.');
            return;
        }
        setError('');
        setIsRecording(true);
        recognitionRef.current.lang = lang;
        recognitionRef.current?.start();
    };

    const stopRecording = () => {
        setIsRecording(false);
        recognitionRef.current?.stop();
    };

    const processWithAI = async () => {
        if (!user) {
            setError('AI 서비스를 사용하려면 먼저 로그인해주세요.');
            return;
        }

        if (!selectedAIService) {
            setError('AI 서비스를 선택해주세요.');
            return;
        }

        if (!transcribedText.trim()) {
            setError('정리할 텍스트가 없습니다.');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            // 사용자의 API 토큰을 가져오는 로직
            // 실제 구현에서는 사용자가 각 AI 서비스의 API 키를 입력하도록 해야 합니다
            const userToken = await getUserToken(selectedAIService.id);

            if (!userToken) {
                setError(`${selectedAIService.name} API 키가 필요합니다. 설정에서 API 키를 입력해주세요.`);
                return;
            }

            const result = await AIServiceManager.processWithAI(
                selectedAIService.id,
                transcribedText,
                userToken
            );

            setSummarizedText(result);
        } catch (error) {
            setError(`${selectedAIService.name} API 호출 오류: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const getUserToken = async (serviceId) => {
        // 실제 구현에서는 사용자가 입력한 API 키를 저장/관리하는 로직이 필요합니다
        // 여기서는 임시로 localStorage에서 가져오는 방식으로 구현
        return localStorage.getItem(`${serviceId}_api_key`);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(summarizedText);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            setError('클립보드 복사에 실패했습니다.');
        }
    };

    const resetAll = () => {
        setTranscribedText('');
        setSummarizedText('');
        setError('');
        setCopySuccess(false);
    };

    const handleTextChange = (e) => {
        setTranscribedText(e.target.value);
    };

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            setError('로그인에 실패했습니다: ' + error.message);
        }
    };

    // 개발 환경에서는 Chrome API 관련 기능 비활성화
    const isDevelopment = !isChromeExtension;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
                        <Volume2 className="text-blue-600" size={40} />
                        AI 음성 텍스트 정리 도구
                    </h1>
                    <p className="text-gray-600 text-lg">
                        음성을 텍스트로 변환하고 AI로 자동 정리하세요
                    </p>
                </div>

                {/* 로그인 상태 및 AI 서비스 선택 */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div>
                                    <p className="font-medium text-gray-800">{user.name}</p>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedAIService ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{selectedAIService.icon}</span>
                                        <span className="font-medium">{selectedAIService.name}</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowAIServiceSelector(!showAIServiceSelector)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Settings size={16} />
                                        AI 서비스 선택
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowAPISettings(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    <Key size={16} />
                                    API 설정
                                </button>
                                <button
                                    onClick={signOut}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <LogOut size={16} />
                                    로그아웃
                                </button>
                                {isDevelopment && (
                                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                        개발 모드
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-600 mb-4">AI 서비스를 사용하려면 로그인해주세요</p>
                            <button
                                onClick={handleLogin}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                            >
                                <LogIn size={20} />
                                Google로 로그인
                            </button>
                        </div>
                    )}
                </div>

                {/* AI 서비스 선택 모달 */}
                {showAIServiceSelector && (
                    <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                        <h3 className="text-lg font-medium mb-4">AI 서비스 선택</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {aiServices.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => {
                                        selectAIService(service.id);
                                        setShowAIServiceSelector(false);
                                    }}
                                    className={`p-4 rounded-lg border-2 transition-all ${selectedAIService?.id === service.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{service.icon}</span>
                                        <div className="text-left">
                                            <p className="font-medium">{service.name}</p>
                                            <p className="text-sm text-gray-600">{service.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 에러 메시지 */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* 컨트롤 버튼들 */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!isSpeechSupported}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${isRecording
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            } ${!isSpeechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                        {isRecording ? '녹음 중지' : '음성 녹음 시작'}
                    </button>

                    <button
                        onClick={processWithAI}
                        disabled={!user || !selectedAIService || !transcribedText.trim() || isProcessing}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                        {isProcessing ? '처리 중...' : 'AI 정리하기'}
                    </button>

                    <button
                        onClick={resetAll}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                    >
                        <RotateCcw size={20} />
                        초기화
                    </button>
                </div>

                {/* 메인 컨텐츠 영역 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 음성 인식 결과 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Mic className="text-blue-600" size={24} />
                            음성 인식 결과
                        </h2>
                        <textarea
                            value={transcribedText}
                            onChange={handleTextChange}
                            placeholder="음성을 녹음하거나 직접 텍스트를 입력하세요..."
                            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="mt-4 flex justify-between items-center">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLang('ko-KR')}
                                    className={`px-3 py-1 rounded text-sm ${lang === 'ko-KR' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    한국어
                                </button>
                                <button
                                    onClick={() => setLang('en-US')}
                                    className={`px-3 py-1 rounded text-sm ${lang === 'en-US' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    English
                                </button>
                            </div>
                            <span className="text-sm text-gray-500">
                                {transcribedText.length}자
                            </span>
                        </div>
                    </div>

                    {/* AI 정리 결과 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FileText className="text-green-600" size={24} />
                            AI 정리 결과
                        </h2>
                        <div className="relative">
                            <div className="w-full h-64 p-4 border border-gray-300 rounded-lg overflow-y-auto bg-gray-50">
                                {summarizedText ? (
                                    <div className="prose prose-sm max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: summarizedText.replace(/\n/g, '<br>') }} />
                                    </div>
                                ) : (
                                    <p className="text-gray-500">AI 정리 결과가 여기에 표시됩니다...</p>
                                )}
                            </div>
                            {summarizedText && (
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute top-2 right-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    <Copy size={16} />
                                </button>
                            )}
                        </div>
                        {copySuccess && (
                            <p className="mt-2 text-sm text-green-600">클립보드에 복사되었습니다!</p>
                        )}
                    </div>
                </div>

                {/* API 설정 모달 */}
                <APISettings
                    isOpen={showAPISettings}
                    onClose={() => setShowAPISettings(false)}
                    aiServices={aiServices}
                />
            </div>
        </div>
    );
};

export default VoiceTextSummarizer;