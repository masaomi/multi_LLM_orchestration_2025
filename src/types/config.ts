export interface ProviderConfig {
  enabled: boolean;
  models: string[];
  // プロバイダー固有の設定は環境変数から直接読み込む
}

export interface PersonaConfig {
  enabled: boolean;
  personas: string[]; // プリセット名またはカスタム名
  baseProvider: string; // 使用するベースプロバイダー (ollama, openrouter, bedrock)
  baseModel: string; // 使用するベースモデル
}

export interface AppConfig {
  providers: {
    bedrock: ProviderConfig;
    openrouter: ProviderConfig;
    ollama: ProviderConfig;
  };
  personas: PersonaConfig;
  orchestration: {
    maxIterations: number;
    consensusThreshold: number;
    parallelExecution: boolean;
  };
}


