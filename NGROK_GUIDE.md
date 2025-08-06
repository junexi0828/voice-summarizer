# ngrok 사용 가이드

## 1. ngrok 계정 설정 (무료)

1. https://ngrok.com 에서 무료 계정 가입
2. 대시보드에서 Auth Token 복사
3. 터미널에서 실행:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## 2. 사용 방법

### 기본 사용법

```bash
# 백엔드 서버를 외부에 노출
ngrok http 3001
```

### 결과

```
Forwarding    https://abc123.ngrok.io -> http://localhost:3001
```

## 3. 환경별 설정

### 로컬 개발 (기본)

- `.env.local`: `REACT_APP_API_URL=http://localhost:3001`
- 서버: `node server.js`

### 외부 테스트 (ngrok)

- `.env.local`: `REACT_APP_API_URL=https://abc123.ngrok.io`
- 서버: `node server.js`
- ngrok: `ngrok http 3001`

## 4. 장단점

### 장점

- ✅ 다른 사용자/기기에서 접근 가능
- ✅ 모바일에서 테스트 가능
- ✅ 실제 배포 환경과 유사한 테스트

### 단점

- ❌ URL이 매번 변경됨
- ❌ 무료 버전은 제한적 (40 connections/min)
- ❌ 세션이 2시간 후 만료

## 5. 실용적인 워크플로우

1. **일반 개발**: localhost 사용
2. **외부 테스트 필요시**: ngrok 사용
3. **배포**: Vercel + Heroku 사용
