import React from 'react';
import './App.css';
import VoiceTextSummarizer from './components/VoiceTextSummarizer';
import { AuthProvider } from './components/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <VoiceTextSummarizer />
      </div>
    </AuthProvider>
  );
}

export default App;
