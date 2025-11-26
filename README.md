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

## クライアントへの統合

### Cursorへの統合

`cursor_mcp_config.json` (または Cursorの設定画面) に以下を追加します。

```json
{
  "mcpServers": {
    "multi-llm": {
      "command": "node",
      "args": ["/absolute/path/to/multi_LLM_orchestration_2025/dist/server.js"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "OLLAMA_MODELS": "qwen3:8b,mistral:latest",
        "MAX_ITERATIONS": "2",
        "CONSENSUS_THRESHOLD": "0.75"
      }
    }
  }
}
```

### Claude Desktop (Claude Code)への統合

Claude Desktopの設定ファイルを編集します。

#### macOSの場合
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

#### Windowsの場合
```
%APPDATA%\Claude\claude_desktop_config.json
```

#### 設定内容
```json
{
  "mcpServers": {
    "multi-llm-orchestration": {
      "command": "node",
      "args": [
        "/Users/your-username/path/to/multi_LLM_orchestration_2025/dist/server.js"
      ],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "OLLAMA_MODELS": "qwen3:8b,mistral:latest",
        "MAX_ITERATIONS": "2",
        "CONSENSUS_THRESHOLD": "0.75",
        "PARALLEL_EXECUTION": "true"
      }
    }
  }
}
```

**注意**: 
- パスは絶対パスで指定してください
- 設定後、Claude Desktopを再起動してください
- `.env`ファイルはサーバー起動ディレクトリにあれば自動的に読み込まれます
- `env`セクションで指定した環境変数は`.env`ファイルの設定を上書きします

### 動作確認

Claude DesktopまたはCursorで以下のように質問してみてください：

```
@multi-llm-orchestration orchestrate_llms ツールを使って、
「Rustの所有権システムについて簡潔に説明してください」というプロンプトで
複数LLMによる合意形成を行ってください。
```

または：

```
process_document ツールを使って、以下の長文を要約してください：
[長文テキスト...]
```

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

## トラブルシューティング

### better-sqlite3のビルドエラー

pnpmを使用している場合、`better-sqlite3`のネイティブバインディングが自動ビルドされないことがあります。

```bash
# エラーが出た場合、以下のコマンドで手動ビルド
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
npm run build-release
cd ../../../../..
```

または：

```bash
# node_modulesを削除して再インストール
rm -rf node_modules
pnpm install
# 上記のビルドコマンドを実行
```

### Ollamaが接続できない

```bash
# Ollamaが起動しているか確認
ollama list

# Ollamaサービスを起動
ollama serve
```

### デバッグモード

`.env`ファイルに以下を追加してデバッグログを有効化：

```env
DEBUG=true
```

### データベースのリセット

```bash
rm -f consensus.db
```

## テスト実行

### 基本テスト

```bash
pnpm test
```

### 開発モード

```bash
pnpm dev
```

