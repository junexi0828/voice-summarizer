import React, { useState } from "react";
import "./App.css";
import VoiceTextSummarizer from "./components/VoiceTextSummarizer";
import PomodoroTimer from "./components/PomodoroTimer";
import BlockPage from "./components/BlockPage";
import ProductivityManager from "./components/ProductivityManager";
import APISettings from "./components/APISettings";
import APITest from "./components/APITest";
import Navigation from "./components/Navigation";
import { AuthProvider } from "./components/AuthProvider";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [showSettings, setShowSettings] = useState(false);

  // AI 서비스 목록
  const aiServices = [
    {
      id: "claude",
      name: "Claude",
      description: "Anthropic의 Claude AI 서비스",
      icon: "🤖",
    },
    {
      id: "gpt",
      name: "GPT",
      description: "OpenAI의 GPT 서비스",
      icon: "🧠",
    },
    {
      id: "groq",
      name: "Groq",
      description: "Groq의 고속 AI 서비스",
      icon: "⚡",
    },
    {
      id: "perplexity",
      name: "Perplexity",
      description: "Perplexity AI 서비스",
      icon: "🔍",
    },
    {
      id: "gemini",
      name: "Gemini",
      description: "Google의 Gemini AI 서비스",
      icon: "🌟",
    },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <VoiceTextSummarizer />;
      case "timer":
        return <PomodoroTimer onTimerComplete={handleTimerComplete} />;
      case "block":
        return <BlockPage onBlockComplete={handleBlockComplete} />;
      case "productivity":
        return <ProductivityManager />;
      case "apitest":
        return <APITest />;
      default:
        return <VoiceTextSummarizer />;
    }
  };

  const handleTimerComplete = async (duration, type) => {
    // 타이머 완료 시 로그 추가
    const timerLog = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      duration: duration,
      type: type,
    };

    try {
      // 백엔드 서버에 저장
      const response = await fetch("http://localhost:3001/api/timer-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ duration, type }),
      });

      if (response.ok) {
        console.log("타이머 로그가 서버에 저장되었습니다.");
      } else {
        console.error("서버 저장 실패, localStorage에 저장");
        // 서버 저장 실패 시 localStorage에 저장
        const savedLogs = JSON.parse(
          localStorage.getItem("productivity_timer_logs") || "[]"
        );
        const updatedLogs = [...savedLogs, timerLog];
        localStorage.setItem(
          "productivity_timer_logs",
          JSON.stringify(updatedLogs)
        );
      }
    } catch (error) {
      console.error("서버 연결 실패, localStorage에 저장:", error);
      // 서버 연결 실패 시 localStorage에 저장
      const savedLogs = JSON.parse(
        localStorage.getItem("productivity_timer_logs") || "[]"
      );
      const updatedLogs = [...savedLogs, timerLog];
      localStorage.setItem(
        "productivity_timer_logs",
        JSON.stringify(updatedLogs)
      );
    }
  };

  const handleBlockComplete = async (duration, reason) => {
    // 차단 완료 시 로그 추가
    const blockLog = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      duration: duration,
      reason: reason,
    };

    try {
      // 백엔드 서버에 저장
      const response = await fetch("http://localhost:3001/api/block-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ duration, reason }),
      });

      if (response.ok) {
        console.log("차단 로그가 서버에 저장되었습니다.");
      } else {
        console.error("서버 저장 실패, localStorage에 저장");
        // 서버 저장 실패 시 localStorage에 저장
        const savedLogs = JSON.parse(
          localStorage.getItem("productivity_block_logs") || "[]"
        );
        const updatedLogs = [...savedLogs, blockLog];
        localStorage.setItem(
          "productivity_block_logs",
          JSON.stringify(updatedLogs)
        );
      }
    } catch (error) {
      console.error("서버 연결 실패, localStorage에 저장:", error);
      // 서버 연결 실패 시 localStorage에 저장
      const savedLogs = JSON.parse(
        localStorage.getItem("productivity_block_logs") || "[]"
      );
      const updatedLogs = [...savedLogs, blockLog];
      localStorage.setItem(
        "productivity_block_logs",
        JSON.stringify(updatedLogs)
      );
    }
  };

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
    if (pageId === "settings") {
      setShowSettings(true);
    } else {
      setShowSettings(false);
    }
  };

  return (
    <AuthProvider>
      <div className="App">
        {/* 네비게이션 */}
        <Navigation currentPage={currentPage} onPageChange={handlePageChange} />

        {/* 메인 컨텐츠 */}
        <main>{renderPage()}</main>

        {/* 설정 모달 */}
        <APISettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          aiServices={aiServices}
          onNavigateToProductivity={() => {
            setShowSettings(false);
            setCurrentPage("productivity");
          }}
        />

        {/* 글로벌 푸터 */}
        <footer className="bg-gray-800 text-white py-8 mt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">EIE</span>
                  </div>
                  <span className="ml-3 text-xl font-semibold">
                    EIE Concierge
                  </span>
                </div>
                <p className="text-gray-300 text-sm">
                  AI 기반 생산성 도구로 더 나은 삶을 만들어가세요.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">서비스</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• AI 음성 텍스트 정리</li>
                  <li>• 포모도로 타이머</li>
                  <li>• 집중 모드 차단</li>
                  <li>• 생산성 관리</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">연락처</h3>
                <div className="text-sm text-gray-300 space-y-2">
                  <p>📧 junexi0828@gmail.com</p>
                  <p>🌐 eieconcierge.com</p>
                  <p>📱 Chrome Extension</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2024 EIE Concierge. All rights reserved.</p>
              <p className="mt-2">개인정보 보호 정책 | 이용약관 | 쿠키 정책</p>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
