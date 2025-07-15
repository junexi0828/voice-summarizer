# AI Voice Summarizer - Chrome Extension

음성을 텍스트로 변환하고 다양한 AI 서비스로 자동 요약하는 크롬 확장 프로그램입니다.

## 🚀 주요 기능

- **음성 인식**: Web Speech API를 사용한 실시간 음성-텍스트 변환
- **다중 AI 서비스 지원**: Claude, GPT, Groq, Perplexity, Gemini
- **API 키 관리**: 각 AI 서비스별 API 키 안전한 저장 및 관리
- **크로스 플랫폼**: 크롬 확장 프로그램으로 어디서든 사용 가능
- **단순한 UX**: 로그인 없이 바로 사용 가능

## 🛠️ 기술 스택

- **Frontend**: React 19, Tailwind CSS
- **음성 인식**: Web Speech API
- **AI 서비스**: Claude, GPT, Groq, Perplexity, Gemini
- **스토리지**: Chrome Storage API, localStorage

## 📦 설치 방법

### 1. 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/junexi0828/voice-summarizer.git
cd voice-summarizer

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 2. 크롬 확장 프로그램 빌드

```bash
# 확장 프로그램용 빌드
npm run build:extension
```

### 3. 크롬에 확장 프로그램 설치

1. 크롬 브라우저에서 `chrome://extensions/` 접속
2. 우측 상단의 "개발자 모드" 활성화
3. "압축해진 확장 프로그램을 로드합니다" 클릭
4. `build` 폴더 선택

## 🔧 설정 방법

### AI 서비스 API 키 설정

1. 확장 프로그램에서 "API 설정" 버튼 클릭
2. 각 AI 서비스별로 API 키 입력:

#### Claude (Anthropic)
- [Anthropic Console](https://console.anthropic.com/)에서 API 키 발급
- `sk-ant-...` 형식의 키 입력

#### GPT (OpenAI)
- [OpenAI Platform](https://platform.openai.com/)에서 API 키 발급
- `sk-...` 형식의 키 입력

#### Groq
- [Groq Console](https://console.groq.com/)에서 API 키 발급

#### Perplexity
- [Perplexity API](https://www.perplexity.ai/settings/api)에서 API 키 발급

#### Gemini (Google)
- [Google AI Studio](https://aistudio.google.com/)에서 API 키 발급

## 🎯 사용 방법

1. **AI 서비스 선택**: 사용하고 싶은 AI 서비스 선택
2. **API 키 입력**: "API 설정"에서 해당 서비스의 API 키 입력
3. **음성 녹음**: "음성 녹음 시작" 버튼으로 녹음 시작
4. **AI 정리**: "AI 정리하기" 버튼으로 텍스트 요약
5. **결과 복사**: 정리된 텍스트를 클립보드에 복사

## 🔒 보안

- API 키는 로컬에 안전하게 저장됩니다
- 모든 API 호출은 HTTPS를 통해 암호화됩니다
- 사용자 인증 없이 바로 사용 가능

## 🚨 주의사항

- 각 AI 서비스의 사용량 제한과 요금 정책을 확인하세요
- API 키는 안전하게 보관하고 공유하지 마세요
- 음성 인식 정확도는 환경과 발음에 따라 달라질 수 있습니다

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**개발자**: Juns
**버전**: 1.0.0
**최종 업데이트**: 2024년 12월
