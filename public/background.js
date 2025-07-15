// 백그라운드 스크립트
chrome.runtime.onInstalled.addListener(() => {
    console.log('AI Voice Summarizer 확장 프로그램이 설치되었습니다.');
});

// OAuth 인증 처리
chrome.identity.onSignInChanged.addListener((account) => {
    if (account) {
        console.log('사용자가 로그인했습니다:', account);
    } else {
        console.log('사용자가 로그아웃했습니다.');
    }
});

// 메시지 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_AUTH_TOKEN') {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ token });
            }
        });
        return true; // 비동기 응답을 위해 true 반환
    }
});