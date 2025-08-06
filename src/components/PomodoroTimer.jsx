import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Clock,
} from "lucide-react";
import NotificationBanner from "./NotificationBanner";

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25분
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [breakCount, setBreakCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [settings, setSettings] = useState({
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  });

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // 알림음 재생
  const playNotificationSound = useCallback(() => {
    if (!isMuted && audioRef.current) {
      audioRef.current.play().catch((e) => console.log("알림음 재생 실패:", e));
    }
  }, [isMuted]);

  // 알림 표시
  const showNotification = useCallback((message, type = "info") => {
    setNotification({
      show: true,
      message,
      type,
    });
  }, []);

  // 타이머 완료 처리
  const handleTimerComplete = useCallback(() => {
    if (!isBreak) {
      // 작업 시간 완료
      setPomodoroCount((prev) => prev + 1);
      const shouldTakeLongBreak =
        (pomodoroCount + 1) % settings.longBreakInterval === 0;
      const breakTime = shouldTakeLongBreak
        ? settings.longBreak
        : settings.shortBreak;
      setTimeLeft(breakTime * 60);
      setIsBreak(true);

      // 알림 표시
      const message = shouldTakeLongBreak
        ? `🎉 작업 완료! ${settings.longBreak}분 긴 휴식을 시작하세요.`
        : `🎯 작업 완료! ${settings.shortBreak}분 휴식을 시작하세요.`;
      showNotification(message, "success");
    } else {
      // 휴식 시간 완료
      setBreakCount((prev) => prev + 1);
      setTimeLeft(settings.workTime * 60);
      setIsBreak(false);

      // 알림 표시
      showNotification("⏰ 휴식 시간 종료! 다시 작업을 시작하세요.", "warning");
    }
    setIsRunning(false);
  }, [
    isBreak,
    pomodoroCount,
    settings.longBreakInterval,
    settings.longBreak,
    settings.shortBreak,
    settings.workTime,
    showNotification,
  ]);

  // 타이머 로직
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 타이머 종료
            playNotificationSound();
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleTimerComplete, playNotificationSound]);

  // 타이머 시작/일시정지
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // 타이머 리셋
  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(settings.workTime * 60);
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 진행률 계산
  const getProgress = () => {
    const totalTime = isBreak
      ? (pomodoroCount % settings.longBreakInterval === 0
          ? settings.longBreak
          : settings.shortBreak) * 60
      : settings.workTime * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Clock className="text-blue-600" size={40} />
            포모도로 타이머
          </h1>
          <p className="text-gray-600 text-lg">
            집중과 휴식을 반복하여 생산성을 높이세요
          </p>
        </div>

        {/* 메인 타이머 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* 상태 표시 */}
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                isBreak
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isBreak ? "🔄 휴식 시간" : "🎯 집중 시간"}
            </div>
          </div>

          {/* 타이머 디스플레이 */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              {/* 진행률 원 */}
              <svg
                className="w-64 h-64 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={isBreak ? "#10b981" : "#3b82f6"}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 45 * (1 - getProgress() / 100)
                  }`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* 시간 표시 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <div className="text-6xl font-bold text-gray-800 mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-lg text-gray-600">
                    {isBreak ? "휴식 중" : "집중 중"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all ${
                isRunning
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? "일시정지" : "시작"}
            </button>

            <button
              onClick={resetTimer}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
            >
              <RotateCcw size={20} />
              리셋
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                isMuted
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              {isMuted ? "음소거" : "소리"}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
            >
              <Settings size={20} />
              설정
            </button>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {pomodoroCount}
              </div>
              <div className="text-sm text-gray-600">완료된 포모도로</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {breakCount}
              </div>
              <div className="text-sm text-gray-600">완료된 휴식</div>
            </div>
          </div>
        </div>

        {/* 설정 패널 */}
        {showSettings && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              타이머 설정
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작업 시간 (분)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.workTime}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      workTime: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  짧은 휴식 (분)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.shortBreak}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      shortBreak: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  긴 휴식 (분)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.longBreak}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      longBreak: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  긴 휴식 간격 (포모도로 수)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.longBreakInterval}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      longBreakInterval: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowSettings(false);
                  resetTimer();
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
              >
                설정 적용
              </button>
            </div>
          </div>
        )}

        {/* 포모도로 기법 설명 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            💡 포모도로 기법이란?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                🎯 집중 시간 (25분)
              </h4>
              <p>
                방해받지 않고 한 가지 작업에만 집중합니다. 타이머가 끝날 때까지
                다른 일을 하지 마세요.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                🔄 휴식 시간 (5분)
              </h4>
              <p>
                짧은 휴식을 취하여 집중력을 회복합니다. 스트레칭이나 간단한
                운동을 해보세요.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                🌟 긴 휴식 (15분)
              </h4>
              <p>
                4개의 포모도로 완료 후 더 긴 휴식을 취합니다. 완전히 다른 활동을
                해보세요.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">📈 효과</h4>
              <p>
                집중력 향상, 피로도 감소, 업무 효율성 증대, 스트레스 감소 효과가
                있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 알림음 */}
        <audio ref={audioRef} preload="auto">
          <source
            src="data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFbgBtbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1t//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjM1AAAAAAAAAAAAAAAAJAYAAAAAAAAABW4A"
            type="audio/mp3"
          />
        </audio>

        {/* 알림 배너 */}
        <NotificationBanner
          show={notification.show}
          message={notification.message}
          type={notification.type}
          onClose={() =>
            setNotification({ show: false, message: "", type: "info" })
          }
        />
      </div>
    </div>
  );
};

export default PomodoroTimer;
