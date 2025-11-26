import { LLMResponse } from '../types/llm-response';

export abstract class BaseLLMProvider {
  abstract readonly name: string;
  
  /**
   * 指定されたモデルでプロンプトに対する応答を生成する
   */
  abstract generate(model: string, prompt: string): Promise<LLMResponse>;

  /**
   * プロバイダーが使用可能か確認する（APIキーの有無など）
   */
  abstract isConfigured(): boolean;
}


