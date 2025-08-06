import React, { useState, useEffect } from "react";
import { Settings, Key, Clock, Shield, Save, Loader2 } from "lucide-react";
import APISettings from "./APISettings";

const Settings = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("api");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    pomodoro: {
      workTime: 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
    },
    block: {
      startTime: "09:00",
      endTime: "18:00",
      days: ["월", "화", "수", "목", "금"],
    },
  });
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings({
            pomodoro: data.settings.pomodoroSettings || settings.pomodoro,
            block: data.settings.blockSchedule || settings.block,
          });
        }
      }
    } catch (error) {
      console.error('설정 로드 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // 포모도로 설정 저장
      const pomodoroResponse = await fetch('http://localhost:3001/api/settings/pomodoro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pomodoroSettings: settings.pomodoro }),
      });

      // 차단 스케줄 설정 저장
      const blockResponse = await fetch('http://localhost:3001/api/settings/block-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings.block),
      });

      if (pomodoroResponse.ok && blockResponse.ok) {
        setSavedMessage("설정이 저장되었습니다!");
        setTimeout(() => setSavedMessage(""), 3000);
      } else {
        setSavedMessage("설정 저장에 실패했습니다.");
        setTimeout(() => setSavedMessage(""), 3000);
      }
    } catch (error) {
      console.error('설정 저장 중 오류:', error);
      setSavedMessage("설정 저장 중 오류가 발생했습니다.");
      setTimeout(() => setSavedMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePomodoroChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      pomodoro: {
        ...prev.pomodoro,
        [field]: parseInt(value) || 0,
      },
    }));
  };

  const handleBlockChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      block: {
        ...prev.block,
        [field]: value,
      },
    }));
  };

  const handleDayToggle = (day) => {
    setSettings(prev => ({
      ...prev,
      block: {
        ...prev.block,
        days: prev.block.days.includes(day)
          ? prev.block.days.filter(d => d !== day)
          : [...prev.block.days, day],
      },
    }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "api", name: "API 키", icon: Key },
    { id: "pomodoro", name: "포모도로", icon: Clock },
    { id: "block", name: "차단 설정", icon: Shield },
  ];

  return (
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
              disabled={isSaving}
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-2 text-gray-600">설정을 불러오는 중...</span>
            </div>
          ) : (
            <>
              {/* 탭 네비게이션 */}
              <div className="flex border-b border-gray-200 mb-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Icon size={16} />
                      {tab.name}
                    </button>
                  );
                })}
              </div>

              {/* 탭 컨텐츠 */}
              <div className="min-h-[400px]">
                {activeTab === "api" && (
                  <APISettings isOpen={true} onClose={() => {}} aiServices={[
                    { id: "claude", name: "Claude", description: "Anthropic Claude", icon: "🤖" },
                    { id: "gpt", name: "GPT", description: "OpenAI GPT", icon: "🧠" },
                    { id: "groq", name: "Groq", description: "Groq LLM", icon: "⚡" },
                    { id: "perplexity", name: "Perplexity", description: "Perplexity AI", icon: "🔍" },
                    { id: "gemini", name: "Gemini", description: "Google Gemini", icon: "💎" },
                  ]} />
                )}

                {activeTab === "pomodoro" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">포모도로 타이머 설정</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          작업 시간 (분)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={settings.pomodoro.workTime}
                          onChange={(e) => handlePomodoroChange("workTime", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          value={settings.pomodoro.shortBreak}
                          onChange={(e) => handlePomodoroChange("shortBreak", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          value={settings.pomodoro.longBreak}
                          onChange={(e) => handlePomodoroChange("longBreak", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          긴 휴식 간격 (세션 수)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.pomodoro.longBreakInterval}
                          onChange={(e) => handlePomodoroChange("longBreakInterval", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "block" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">집중 모드 차단 설정</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          시작 시간
                        </label>
                        <input
                          type="time"
                          value={settings.block.startTime}
                          onChange={(e) => handleBlockChange("startTime", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          종료 시간
                        </label>
                        <input
                          type="time"
                          value={settings.block.endTime}
                          onChange={(e) => handleBlockChange("endTime", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        차단 요일
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                          <button
                            key={day}
                            onClick={() => handleDayToggle(day)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              settings.block.days.includes(day)
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {savedMessage && (
                <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {savedMessage}
                </div>
              )}

              {/* 저장 버튼 */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 