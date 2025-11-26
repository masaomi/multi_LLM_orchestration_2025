import dotenv from 'dotenv';
import { AppConfig, ProviderConfig, PersonaConfig } from '../types/config';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root (handle both CJS and ES module contexts)
const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env'), debug: true });

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
      personas: this.loadPersonaConfig(),
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

  private loadPersonaConfig(): PersonaConfig {
    const personasStr = process.env.PERSONAS;
    const personas = personasStr ? personasStr.split(',').map(p => p.trim()).filter(p => p.length > 0) : [];
    
    return {
      enabled: personas.length > 0,
      personas: personas,
      baseProvider: process.env.PERSONA_BASE_PROVIDER || 'ollama',
      baseModel: process.env.PERSONA_BASE_MODEL || 'llama3.1'
    };
  }
}

