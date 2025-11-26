import { BaseLLMProvider } from "./base-provider";
import { BedrockProvider } from "./bedrock-provider";
import { OpenRouterProvider } from "./openrouter-provider";
import { OllamaProvider } from "./ollama-provider";
import { ConfigLoader } from "../utils/config-loader";
import { Logger } from "../utils/logger";

export interface ActiveModel {
  provider: BaseLLMProvider;
  modelName: string;
  id: string; // provider:modelName
}

export class ProviderFactory {
  private providers: Map<string, BaseLLMProvider> = new Map();

  constructor() {
    this.providers.set('bedrock', new BedrockProvider());
    this.providers.set('openrouter', new OpenRouterProvider());
    this.providers.set('ollama', new OllamaProvider());
  }

  public getActiveModels(): ActiveModel[] {
    const config = ConfigLoader.getInstance().getConfig();
    const activeModels: ActiveModel[] = [];

    // Bedrock
    if (config.providers.bedrock.enabled && this.providers.get('bedrock')?.isConfigured()) {
      config.providers.bedrock.models.forEach(model => {
        activeModels.push({
          provider: this.providers.get('bedrock')!,
          modelName: model,
          id: `bedrock:${model}`
        });
      });
    }

    // OpenRouter
    if (config.providers.openrouter.enabled && this.providers.get('openrouter')?.isConfigured()) {
      config.providers.openrouter.models.forEach(model => {
        activeModels.push({
          provider: this.providers.get('openrouter')!,
          modelName: model,
          id: `openrouter:${model}`
        });
      });
    }

    // Ollama
    if (config.providers.ollama.enabled && this.providers.get('ollama')?.isConfigured()) {
      config.providers.ollama.models.forEach(model => {
        activeModels.push({
          provider: this.providers.get('ollama')!,
          modelName: model,
          id: `ollama:${model}`
        });
      });
    }

    if (activeModels.length < 2) {
      Logger.warn("有効なLLMモデルが2つ未満です。合意形成には少なくとも2つのモデルが推奨されます。");
    }

    return activeModels;
  }
}

