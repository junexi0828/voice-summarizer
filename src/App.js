import React, { useState } from "react";
import "./App.css";
import VoiceTextSummarizer from "./components/VoiceTextSummarizer";
import PomodoroTimer from "./components/PomodoroTimer";
import BlockPage from "./components/BlockPage";
import Settings from "./components/Settings";
import Navigation from "./components/Navigation";
import { AuthProvider } from "./components/AuthProvider";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [showSettings, setShowSettings] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <VoiceTextSummarizer />;
      case "timer":
        return <PomodoroTimer />;
      case "block":
        return <BlockPage />;
      default:
        return <VoiceTextSummarizer />;
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
        <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

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
