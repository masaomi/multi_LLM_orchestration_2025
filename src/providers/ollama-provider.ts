import { BaseLLMProvider } from "./base-provider";
import { LLMResponse } from "../types/llm-response";
import { Logger } from "../utils/logger";
import { Ollama } from "ollama";

export class OllamaProvider extends BaseLLMProvider {
  readonly name = "ollama";
  private client: Ollama;

  constructor() {
    super();
    const host = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.client = new Ollama({ host });
  }

  async generate(model: string, prompt: string): Promise<LLMResponse> {
    try {
      const response = await this.client.chat({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      return {
        provider: this.name,
        model: model,
        content: response.message.content,
        metadata: {
          eval_count: response.eval_count,
          eval_duration: response.eval_duration
        }
      };
    } catch (error: any) {
      Logger.error(`Ollama error (${model}):`, error.message);
      throw error;
    }
  }

  isConfigured(): boolean {
    // Ollamaはローカルで動作するため、ホストURLが設定されていればOK（デフォルトあり）
    // ただし、実際に接続できるかは別問題
    return true; 
  }
}

