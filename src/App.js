import React from 'react';
import './App.css';
import VoiceTextSummarizer from './components/VoiceTextSummarizer';
import { AuthProvider } from './components/AuthProvider';

function App() {
  return (
    <>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <VoiceTextSummarizer />
          </div>
          {/* 푸터 */}
          <footer className="w-full py-4 bg-gray-100 text-center text-xs text-gray-500 border-t">
            © 2025 Juns. 모든 권리 보유. | 이 서비스는 사용자의 API 키를 서버에 저장하지 않으며, 모든 데이터는 브라우저 로컬에만 저장됩니다. | 무단 복제 및 배포 금지
          </footer>
        </div>
      </AuthProvider>
    </>
  );
}

export default App;
