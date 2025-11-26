# Multi-LLM Orchestration MCP Server

Consensus Protocol v2に基づき、複数のLLM（AWS Bedrock, OpenRouter, Ollama）をオーケストレーションし、相互評価による合意形成を行うMCPサーバーです。

## 機能

- **Consensus Protocol v2**: 複数LLMによる生成、相互評価、合意形成のプロセスを自動化
- **Map-Reduce処理**: Context Windowを超える長文ドキュメントの分割処理と統合
- **マルチプロバイダー対応**: AWS Bedrock, OpenRouter, Ollamaをサポート
- **SQLite履歴管理**: 全てのセッション、応答、評価、チャンクをローカルDBに保存

## セットアップ

### 1. 前提条件
- Node.js v18以上
- pnpm (推奨) または npm

### 2. インストール
```bash
pnpm install
pnpm build
```

### 3. 環境変数設定
`.env.example`を`.env`にコピーし、必要な設定を行います。

```bash
cp .env.example .env
```

#### .env 設定例
```env
# 使用したいプロバイダーのみ設定してください

# AWS Bedrock (AWSクレデンシャルが別途必要)
AWS_REGION=us-east-1
BEDROCK_MODELS=anthropic.claude-3-5-sonnet-20241022-v2:0

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODELS=anthropic/claude-3.5-sonnet,openai/gpt-4-turbo

# Ollama (ローカル)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODELS=llama3.1

# 設定
MAX_ITERATIONS=3
CONSENSUS_THRESHOLD=0.75
```

## Cursorへの統合

`cursor_mcp_config.json` (または Cursorの設定画面) に以下を追加します。

```json
{
  "mcpServers": {
    "multi-llm": {
      "command": "node",
      "args": ["/absolute/path/to/multi_LLM_orchestration_2025/dist/server.js"],
      "env": {
        "AWS_REGION": "us-east-1",
        "AWS_PROFILE": "default",
        "OPENROUTER_API_KEY": "your_key"
        // その他の環境変数は.envファイル、またはここに直接記述
      }
    }
  }
}
```
※ `.env`ファイルはサーバー起動ディレクトリ（プロジェクトルート）にあれば読み込まれます。

## 利用可能なツール

### `orchestrate_llms`
プロンプトに対して複数LLMで合意形成を行います。
- `prompt`: プロンプト本文
- `iterations`: 最大反復回数（オプション）
- `parallel`: 並列実行するかどうか（オプション）

### `process_document`
長文ドキュメントを処理します。
- `document`: ドキュメント本文
- `task`: タスク内容（要約、分析など）

### `get_consensus_details`
セッションの詳細（各LLMの応答、評価スコアなど）を取得します。
- `sessionId`: セッションID

## データベース
`consensus.db` というSQLiteファイルがプロジェクトルートに作成されます。

