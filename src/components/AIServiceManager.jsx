// AI 서비스 관리자 클래스

class AIServiceManager {
    constructor() {
        this.services = {
            claude: {
                name: 'Claude',
                baseUrl: 'https://api.anthropic.com/v1/messages',
                headers: {
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                }
            },
            gpt: {
                name: 'GPT',
                baseUrl: 'https://api.openai.com/v1/chat/completions',
                headers: {
                    'content-type': 'application/json',
                }
            },
            groq: {
                name: 'Groq',
                baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
                headers: {
                    'content-type': 'application/json',
                }
            },
            perplexity: {
                name: 'Perplexity',
                baseUrl: 'https://api.perplexity.ai/chat/completions',
                headers: {
                    'content-type': 'application/json',
                }
            },
            gemini: {
                name: 'Gemini',
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                headers: {
                    'content-type': 'application/json',
                }
            }
        };
    }

    async processWithAI(serviceId, text, userToken) {
        const service = this.services[serviceId];
        if (!service) {
            throw new Error(`지원하지 않는 AI 서비스: ${serviceId}`);
        }

        const prompt = this.createPrompt(text);

        try {
            let response;

            switch (serviceId) {
                case 'claude':
                    response = await this.callClaudeAPI(prompt, userToken);
                    break;
                case 'gpt':
                    response = await this.callGPTAPI(prompt, userToken);
                    break;
                case 'groq':
                    response = await this.callGroqAPI(prompt, userToken);
                    break;
                case 'perplexity':
                    response = await this.callPerplexityAPI(prompt, userToken);
                    break;
                case 'gemini':
                    response = await this.callGeminiAPI(prompt, userToken);
                    break;
                default:
                    throw new Error(`지원하지 않는 AI 서비스: ${serviceId}`);
            }

            return response;
        } catch (error) {
            console.error(`${service.name} API 호출 오류:`, error);
            throw error;
        }
    }

    createPrompt(text) {
        return `당신은 AI 요약 도우미입니다.
아래 텍스트는 사용자가 말한 음성을 실시간으로 텍스트로 변환한 것입니다.
구어체 표현, 말버릇, 반복, 문장 부정확성 등이 포함되어 있을 수 있습니다.
이 텍스트를 아래 조건에 맞게 정리하고 요약해 주세요:

1. 핵심 내용을 놓치지 말고 최대한 **간결하고 명확하게 요약**해 주세요.
2. **불필요한 말버릇**(예: 음…, 어…, 그러니까…, 뭐랄까…)은 제거해 주세요.
3. 의미가 중복되거나, 불명확한 문장은 **보완하거나 삭제**해 주세요.
4. 일정, 할 일, 정보, 주요 의견 등은 **리스트 형식**으로 정리해 주세요.
5. 전체 결과는 **Markdown 형식**으로 출력해 주세요.
6. **요약문이 아닌 "정리된 원문" 느낌으로 재구성해도 좋습니다.**

---
🗣️ **사용자 음성 인식 텍스트 원문**:
"""
${text}
"""

위 텍스트를 조건에 맞게 정리해서 Markdown 형식으로 출력해 주세요.`;
    }

    async callClaudeAPI(prompt, userToken) {
        const response = await fetch(this.services.claude.baseUrl, {
            method: 'POST',
            headers: {
                ...this.services.claude.headers,
                'x-api-key': userToken,
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024
            }),
        });

        if (!response.ok) {
            throw new Error(`Claude API 오류: ${response.status}`);
        }

        const data = await response.json();
        return data?.content?.[0]?.text || '결과를 받아오지 못했습니다.';
    }

    async callGPTAPI(prompt, userToken) {
        const response = await fetch(this.services.gpt.baseUrl, {
            method: 'POST',
            headers: {
                ...this.services.gpt.headers,
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024
            }),
        });

        if (!response.ok) {
            throw new Error(`GPT API 오류: ${response.status}`);
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || '결과를 받아오지 못했습니다.';
    }

    async callGroqAPI(prompt, userToken) {
        const response = await fetch(this.services.groq.baseUrl, {
            method: 'POST',
            headers: {
                ...this.services.groq.headers,
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API 오류: ${response.status}`);
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || '결과를 받아오지 못했습니다.';
    }

    async callPerplexityAPI(prompt, userToken) {
        const response = await fetch(this.services.perplexity.baseUrl, {
            method: 'POST',
            headers: {
                ...this.services.perplexity.headers,
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024
            }),
        });

        if (!response.ok) {
            throw new Error(`Perplexity API 오류: ${response.status}`);
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || '결과를 받아오지 못했습니다.';
    }

    async callGeminiAPI(prompt, userToken) {
        const response = await fetch(`${this.services.gemini.baseUrl}?key=${userToken}`, {
            method: 'POST',
            headers: this.services.gemini.headers,
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API 오류: ${response.status}`);
        }

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || '결과를 받아오지 못했습니다.';
    }
}

const aiServiceManager = new AIServiceManager();
export default aiServiceManager;