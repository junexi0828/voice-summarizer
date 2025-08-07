// AI 서비스 관리자 클래스

class AIServiceManager {
  constructor() {
    this.services = {
      claude: {
        name: "Claude",
        proxyUrl: "/api/ai/claude",
      },
      gpt: {
        name: "GPT",
        proxyUrl: "/api/ai/gpt",
      },
      groq: {
        name: "Groq",
        proxyUrl: "/api/ai/groq",
      },
      perplexity: {
        name: "Perplexity",
        proxyUrl: "/api/ai/perplexity",
      },
      gemini: {
        name: "Gemini",
        proxyUrl: "/api/ai/gemini",
      },
    };
  }

  async processWithAI(serviceId, text, userToken) {
    const service = this.services[serviceId];
    if (!service) {
      throw new Error(`지원하지 않는 AI 서비스: ${serviceId}`);
    }

    const prompt = this.createPrompt(text);

    try {
      // 백엔드 프록시를 통해 AI API 호출
      const response = await fetch(service.proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          apiKey: userToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `${service.name} API 호출 실패`);
      }

      return data.result;
    } catch (error) {
      console.error(`${service.name} API 호출 오류:`, error);
      throw error;
    }
  }

  createPrompt(text) {
    return `당신은 텍스트 정리 및 요약 전문가입니다.

아래는 사용자가 음성으로 입력한 텍스트입니다. 구어체, 말버릇, 반복, 부정확한 문장이 포함되어 있을 수 있습니다.

**아래 조건에 따라 텍스트를 정리해 주세요:**
1. 핵심 내용을 놓치지 말고 간결하고 명확하게 요약해 주세요.
2. 불필요한 말버릇(예: 음…, 어…, 그러니까…, 뭐랄까…)은 제거해 주세요.
3. 의미가 중복되거나 불명확한 문장은 보완하거나 삭제해 주세요.
4. 일정, 할 일, 정보, 주요 의견 등은 리스트 형식으로 정리해 주세요.
5. 필요하다면 Mermaid, Graphviz, Markdown 등 텍스트 기반 다이어그램/문서 언어를 자유롭게 활용해 표, 도식, 플로우차트 등을 생성해 주세요.
6. 결과는 자연스러운 일반 텍스트로 출력해 주세요. (불필요한 코드블록, 마크다운 감싸기 없이)
7. 요약문이 아닌 “정리된 원문” 느낌으로 재구성해도 좋습니다.

---
🗣️ 사용자 음성 인식 텍스트 원문:
"""
${text}
"""

위 조건에 맞게 정리해 주세요.`;
  }
}

const aiServiceManager = new AIServiceManager();
export default aiServiceManager;
