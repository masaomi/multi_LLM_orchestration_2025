import axios from "axios";
import { BaseLLMProvider } from "./base-provider";
import { LLMResponse } from "../types/llm-response";
import { Logger } from "../utils/logger";

export class OpenRouterProvider extends BaseLLMProvider {
  readonly name = "openrouter";
  private apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = process.env.OPENROUTER_API_KEY;
  }

  async generate(model: string, prompt: string): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API Key is not set");
    }

    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/multi-llm-orchestration", // Required by OpenRouter
            "X-Title": "Multi-LLM Orchestration MCP" // Optional
          }
        }
      );

      const content = response.data.choices[0]?.message?.content || "";

      return {
        provider: this.name,
        model: model,
        content: content,
        metadata: {
          usage: response.data.usage
        }
      };
    } catch (error: any) {
      Logger.error(`OpenRouter error (${model}):`, error.response?.data || error.message);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}


