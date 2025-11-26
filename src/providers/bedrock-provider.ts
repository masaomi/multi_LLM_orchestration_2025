import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BaseLLMProvider } from "./base-provider";
import { LLMResponse } from "../types/llm-response";
import { Logger } from "../utils/logger";

export class BedrockProvider extends BaseLLMProvider {
  readonly name = "bedrock";
  private client: BedrockRuntimeClient | null = null;

  constructor() {
    super();
    if (this.isConfigured()) {
      // ユーザー指定のBearer Tokenがある場合、それを優先的に使用するロジックを検討
      // ただし、AWS SDK標準ではBearer Token認証は特定のサービスのみ。
      // ここでは、AWS_BEARER_TOKEN_BEDROCKが設定されている場合、
      // 何らかの形で認証に使用することを想定しますが、
      // AWS SDKの仕様上、credentialsオブジェクトにはaccessKeyId/secretAccessKeyが必要です。
      // もしこれがセッショントークンならsessionTokenにマッピングします。
      
      const region = process.env.AWS_REGION || "us-east-1";
      const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
      
      // Bearer Tokenが指定されている場合、環境変数からの標準的な認証情報読み込みよりも
      // 優先されるべきか、あるいは追加情報として扱うか。
      // ここでは標準的な認証チェーンを使用しつつ、
      // 特定の要件（もしベアラートークンが必須なら）に対応できるよう構造化します。
      
      // AWS SDKはデフォルトで環境変数(AWS_ACCESS_KEY_ID等)を読み込みます。
      // コンストラクタに空のオブジェクトを渡すとデフォルトプロバイダーチェーンが使われます。
      this.client = new BedrockRuntimeClient({ region });
    }
  }

  async generate(model: string, prompt: string): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error("Bedrock client is not initialized");
    }

    try {
      // Claude 3モデル用のペイロード構築
      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: model,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload)
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Claudeのレスポンス形式に合わせたパース
      let content = "";
      if (responseBody.content && Array.isArray(responseBody.content)) {
        content = responseBody.content.map((c: any) => c.text).join("");
      } else if (responseBody.completion) {
        content = responseBody.completion;
      }

      return {
        provider: this.name,
        model: model,
        content: content,
        metadata: {
          latency: 0, // TODO: 計測
          usage: responseBody.usage
        }
      };
    } catch (error: any) {
      Logger.error(`Bedrock error (${model}):`, error);
      throw error;
    }
  }

  isConfigured(): boolean {
    // 環境変数が設定されているか確認
    // AWS_REGIONは必須、認証情報はSDKのデフォルトチェーンまたはBEARER_TOKEN
    return !!process.env.AWS_REGION && 
           (!!process.env.AWS_ACCESS_KEY_ID || !!process.env.AWS_BEARER_TOKEN_BEDROCK || !!process.env.AWS_PROFILE);
  }
}

