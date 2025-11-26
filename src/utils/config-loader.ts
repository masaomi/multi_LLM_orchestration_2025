import dotenv from 'dotenv';
import { AppConfig, ProviderConfig } from '../types/config';

dotenv.config();

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  private loadConfig(): AppConfig {
    return {
      providers: {
        bedrock: this.loadProviderConfig('BEDROCK_MODELS'),
        openrouter: this.loadProviderConfig('OPENROUTER_MODELS'),
        ollama: this.loadProviderConfig('OLLAMA_MODELS'),
      },
      orchestration: {
        maxIterations: parseInt(process.env.MAX_ITERATIONS || '3', 10),
        consensusThreshold: parseFloat(process.env.CONSENSUS_THRESHOLD || '0.75'),
        parallelExecution: process.env.PARALLEL_EXECUTION !== 'false',
      },
    };
  }

  private loadProviderConfig(modelsEnvVar: string): ProviderConfig {
    const modelsStr = process.env[modelsEnvVar];
    const models = modelsStr ? modelsStr.split(',').map(m => m.trim()).filter(m => m.length > 0) : [];
    
    return {
      enabled: models.length > 0,
      models: models,
    };
  }
}

