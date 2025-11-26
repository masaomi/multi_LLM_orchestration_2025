import { BaseLLMProvider } from "./base-provider";
import { BedrockProvider } from "./bedrock-provider";
import { OpenRouterProvider } from "./openrouter-provider";
import { OllamaProvider } from "./ollama-provider";
import { PersonaProvider } from "./persona-provider";
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

    // Check if Persona Mode is enabled
    if (config.personas && config.personas.enabled) {
      Logger.info("Persona Mode Enabled. Configuring persona-based agents...");
      const baseProviderName = config.personas.baseProvider;
      const baseModelName = config.personas.baseModel;
      const baseProvider = this.providers.get(baseProviderName);

      if (!baseProvider || !baseProvider.isConfigured()) {
        Logger.error(`Base provider '${baseProviderName}' for personas is not configured or not found.`);
        // Fallback to normal mode or empty
      } else {
        config.personas.personas.forEach(personaName => {
          const personaProvider = new PersonaProvider(baseProvider, personaName);
          activeModels.push({
            provider: personaProvider,
            modelName: baseModelName,
            // ID format: provider:model:persona (to ensure uniqueness)
            // But the system uses provider:model as ID often. 
            // PersonaProvider.name is the base provider name.
            // We need a unique ID. Let's use a custom ID format.
            id: `persona:${personaName}` 
          });
        });

        if (activeModels.length > 0) {
            return activeModels;
        }
      }
    }

    // Normal Mode (Existing Logic)
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


