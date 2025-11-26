export interface ProviderConfig {
  enabled: boolean;
  models: string[];
  // プロバイダー固有の設定は環境変数から直接読み込む
}

export interface AppConfig {
  providers: {
    bedrock: ProviderConfig;
    openrouter: ProviderConfig;
    ollama: ProviderConfig;
  };
  orchestration: {
    maxIterations: number;
    consensusThreshold: number;
    parallelExecution: boolean;
  };
}

