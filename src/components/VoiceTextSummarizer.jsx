import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, FileText, Copy, RotateCcw, Volume2, Loader2 } from 'lucide-react';

const VoiceTextSummarizer = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState('');
    const [summarizedText, setSummarizedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [error, setError] = useState('');
    const [lang, setLang] = useState('ko-KR'); // 언어 상태 추가

    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);

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
    }, [lang]); // 언어 변경 시마다 effect 재실행

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
        recognitionRef.current.lang = lang; // 언어 설정 반영
        recognitionRef.current?.start();
    };

    const stopRecording = () => {
        setIsRecording(false);
        recognitionRef.current?.stop();
    };

    // Claude API 연동(fetch 방식)
    const processWithClaude = async () => {
        if (!transcribedText.trim()) {
            setError('정리할 텍스트가 없습니다.');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const API_KEY = "YOUR_CLAUDE_API_KEY"; // 여기에 본인의 Claude API Key를 입력하세요
            const prompt = `당신은 AI 요약 도우미입니다.\n아래 텍스트는 사용자가 말한 음성을 실시간으로 텍스트로 변환한 것입니다.  \n구어체 표현, 말버릇, 반복, 문장 부정확성 등이 포함되어 있을 수 있습니다.\n이 텍스트를 아래 조건에 맞게 정리하고 요약해 주세요:\n\n1. 핵심 내용을 놓치지 말고 최대한 **간결하고 명확하게 요약**해 주세요.  \n2. **불필요한 말버릇**(예: 음…, 어…, 그러니까…, 뭐랄까…)은 제거해 주세요.  \n3. 의미가 중복되거나, 불명확한 문장은 **보완하거나 삭제**해 주세요.  \n4. 일정, 할 일, 정보, 주요 의견 등은 **리스트 형식**으로 정리해 주세요.\n5. 전체 결과는 **Markdown 형식**으로 출력해 주세요.\n6. **요약문이 아닌 \"정리된 원문\" 느낌으로 재구성해도 좋습니다.**\n\n---\n🗣️ **사용자 음성 인식 텍스트 원문**:\n\"\"\"\n${transcribedText}\n\"\"\"\n\n위 텍스트를 조건에 맞게 정리해서 Markdown 형식으로 출력해 주세요.`;

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1024
                }),
            });

            const data = await response.json();
            setSummarizedText(data?.content?.[0]?.text || '결과를 받아오지 못했습니다.');
        } catch (error) {
            setError('Claude API 호출 오류: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
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
                        음성을 텍스트로 변환하고 Claude AI로 자동 정리하세요
                    </p>
                </div>

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
                        onClick={processWithClaude}
                        disabled={!transcribedText.trim() || isProcessing}
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
                    {/* 입력 영역 */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Mic className="text-blue-600" size={24} />
                            음성 인식 텍스트
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                정확도 향상 모드
                            </span>
                        </h2>
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                                💡 <strong>정확도 향상 모드</strong>: 실시간 스트리밍을 비활성화하여 더 정확한 인식을 제공합니다. 문장을 완성한 후 잠시 기다리면 텍스트가 나타납니다.
                            </p>
                        </div>
                        {/* 언어 선택 드롭다운 */}
                        <div className="mb-4">
                            <label htmlFor="lang-select" className="mr-2 font-medium">언어 선택:</label>
                            <select
                                id="lang-select"
                                value={lang}
                                onChange={e => setLang(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1"
                                disabled={isRecording}
                            >
                                <option value="ko-KR">한국어</option>
                                <option value="en-US">영어</option>
                            </select>
                        </div>
                        <textarea
                            value={transcribedText}
                            onChange={handleTextChange}
                            placeholder="음성 녹음을 시작하거나 직접 텍스트를 입력하세요..."
                            className="w-full h-80 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="mt-4 text-sm text-gray-600">
                            {transcribedText.length} 글자 | {isRecording && <span className="text-red-600 animate-pulse">🔴 녹음 중...</span>}
                        </div>
                    </div>

                    {/* 출력 영역 */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText className="text-green-600" size={24} />
                            AI 정리 결과
                            {summarizedText && (
                                <button
                                    onClick={copyToClipboard}
                                    className={`ml-auto flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all ${copySuccess
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    <Copy size={16} />
                                    {copySuccess ? '복사됨!' : '복사'}
                                </button>
                            )}
                        </h2>
                        <div className="h-80 p-4 border border-gray-300 rounded-lg bg-gray-50 overflow-y-auto">
                            {summarizedText ? (
                                <div className="prose max-w-none">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                                        {summarizedText}
                                    </pre>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    {isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" size={20} />
                                            Claude AI가 텍스트를 정리하고 있습니다...
                                        </div>
                                    ) : (
                                        '정리된 텍스트가 여기에 표시됩니다'
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 사용 가이드 */}
                <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 사용 가이드</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                            <h4 className="font-medium text-gray-800 mb-2">음성 녹음 방법</h4>
                            <p>• "음성 녹음 시작" 버튼을 클릭하세요</p>
                            <p>• 브라우저에서 마이크 권한을 허용하세요</p>
                            <p>• 자연스럽게 말씀하시면 실시간으로 텍스트화됩니다</p>
                            <p className="text-blue-600 font-medium mt-2">🎯 정확도 향상 팁:</p>
                            <p>• 조용한 환경에서 사용하세요</p>
                            <p>• 명확하고 천천히 발음하세요</p>
                            <p>• 문장 단위로 끊어서 말씀하세요</p>
                            <p>• 마이크와의 거리를 20-30cm로 유지하세요</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-800 mb-2">AI 정리 기능</h4>
                            <p>• 말버릇, 반복 표현을 자동으로 제거합니다</p>
                            <p>• 일정, 할 일, 정보를 자동으로 분류합니다</p>
                            <p>• 결과는 Markdown 형식으로 제공됩니다</p>
                            <p className="text-orange-600 font-medium mt-2">⚠️ 현재 제한사항:</p>
                            <p>• 브라우저 내장 음성 인식 사용 중</p>
                            <p>• 정확도 향상을 위해 실시간성 제한</p>
                            <p>• 더 정확한 인식이 필요하면 네이버 클로바 STT로 업그레이드 예정</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceTextSummarizer;