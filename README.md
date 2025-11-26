# Multi-LLM Orchestration MCP Server

[日本語版はこちら / Japanese version below](#日本語版)

An MCP server that orchestrates multiple LLMs (AWS Bedrock, OpenRouter, Ollama) based on Consensus Protocol v2, enabling mutual evaluation and consensus formation.

## Features

- **Consensus Protocol v2**: Automated generation, mutual evaluation, and consensus formation across multiple LLMs
- **Map-Reduce Processing**: Split and process large documents exceeding context windows
- **Persona-based Agent Ensemble**: Assign different personas (e.g., Critical, Creative) to a single model to simulate multi-agent discussion
- **Multi-Provider Support**: AWS Bedrock, OpenRouter, and Ollama
- **SQLite History Management**: Store all sessions, responses, evaluations, and chunks in local database

## Setup

### 1. Prerequisites
- Node.js v18 or higher
- pnpm (recommended) or npm

### 2. Installation
```bash
pnpm install
pnpm build
```

**Note**: If you encounter `better-sqlite3` build errors with pnpm, manually build it:
```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
npm run build-release
cd ../../../../..
```

### 3. Environment Configuration

Copy `env.sample` to `.env` and configure:

```bash
cp env.sample .env
```

#### .env Example (All Providers)
```env
# Configure only the providers you want to use

# AWS Bedrock (requires AWS credentials)
AWS_REGION=us-east-1
BEDROCK_MODELS=anthropic.claude-3-5-sonnet-20241022-v2:0

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODELS=anthropic/claude-3.5-sonnet,openai/gpt-4-turbo

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODELS=qwen3:8b,mistral:latest

# Settings
MAX_ITERATIONS=3
CONSENSUS_THRESHOLD=0.75
PARALLEL_EXECUTION=true
```

#### .env Example (Persona Mode)
```env
# Use a single model (e.g., Ollama) to simulate multiple personas
OLLAMA_BASE_URL=http://localhost:11434
# No need to set OLLAMA_MODELS if using Persona Mode exclusively

# Persona Settings (use semicolon as delimiter)
PERSONAS=critical;creative;Einstein
# You can also use detailed descriptions:
# PERSONAS=critical;creative;物理学者で捻くれ者で、常に斜め上からの視点で物事を考える変態
PERSONA_BASE_PROVIDER=ollama
PERSONA_BASE_MODEL=llama3.1

# Orchestration Settings
MAX_ITERATIONS=3
CONSENSUS_THRESHOLD=0.75
PARALLEL_EXECUTION=true
```

#### .env Example (Ollama Only - For Testing)
```env
# AWS Bedrock (disabled)
# AWS_REGION=us-east-1
# BEDROCK_MODELS=

# OpenRouter (disabled)
# OPENROUTER_API_KEY=
# OPENROUTER_MODELS=

# Ollama Settings (for testing)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODELS=qwen3:8b,mistral:latest

# Orchestration Settings
MAX_ITERATIONS=2
CONSENSUS_THRESHOLD=0.75
PARALLEL_EXECUTION=true
DEBUG=true
```

## Client Integration

### Cursor Integration

**Option 1: Using .env file (Recommended)**

Add to Cursor's MCP settings. The server will automatically load settings from `.env` file:

```json
{
  "mcpServers": {
    "multi-llm": {
      "command": "node",
      "args": ["/absolute/path/to/multi_LLM_orchestration_2025/dist/server.js"]
    }
  }
}
```

**Option 2: Explicit environment variables**

Or specify environment variables directly in the configuration:

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
        "CONSENSUS_THRESHOLD": "0.75",
        "PARALLEL_EXECUTION": "true",
        "DEBUG": "true"
      }
    }
  }
}
```

### Claude Desktop (Claude Code) Integration

Edit Claude Desktop's configuration file:

#### macOS
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

#### Windows
```
%APPDATA%\Claude\claude_desktop_config.json
```

#### Configuration
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

**Important**: 
- Use absolute paths
- Restart Claude Desktop after configuration
- Environment variables in `env` section override `.env` file settings

### Verification

Try asking in Claude Desktop or Cursor:

```
Use the orchestrate_llms tool to run consensus formation on the prompt:
"Explain Rust's ownership system concisely"
```

Or:

```
Use the process_document tool to summarize the following long text:
[long text...]
```

## Available Tools

### `orchestrate_llms`
Run consensus formation across multiple LLMs for a given prompt.
- `prompt`: The prompt text
- `iterations`: Maximum iterations (optional)
- `parallel`: Run in parallel mode (optional)

### `process_document`
Process large documents with automatic chunking.
- `document`: Document text
- `task`: Task description (e.g., "summarize", "analyze")

### `get_consensus_details`
Retrieve detailed information about a consensus session.
- `sessionId`: Session ID

## Database
A SQLite file `consensus.db` will be created in the project root.

## Testing

### Basic Test
```bash
pnpm test
```

### Development Mode
```bash
pnpm dev
```

## Troubleshooting

### better-sqlite3 Build Error

If using pnpm, native bindings may not build automatically:

```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
npm run build-release
cd ../../../../..
```

Or reinstall:

```bash
rm -rf node_modules
pnpm install
# Run the build command above
```

### Ollama Connection Issues

```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve
```

### Debug Mode

Add to `.env`:

```env
DEBUG=true
```

### Reset Database

```bash
rm -f consensus.db
```

---

# 日本語版

複数のLLM（AWS Bedrock、OpenRouter、Ollama）をConsensus Protocol v2に基づいてオーケストレーションし、相互評価による合意形成を行うMCPサーバーです。

## 機能

- **Consensus Protocol v2**: 複数LLMによる生成、相互評価、合意形成のプロセスを自動化
- **Map-Reduce処理**: Context Windowを超える長文ドキュメントの分割処理と統合
- **Persona-based Agent Ensemble**: 単一モデルに異なるペルソナ（批判的、創造的など）を割り当て、複数エージェント間の議論をシミュレート
- **マルチプロバイダー対応**: AWS Bedrock、OpenRouter、Ollamaをサポート
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

**注意**: pnpm使用時に`better-sqlite3`のビルドエラーが出る場合は、手動でビルドしてください：
```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
npm run build-release
cd ../../../../..
```

### 3. 環境変数設定

`env.sample`を`.env`にコピーして設定します：

```bash
cp env.sample .env
```

#### .env 設定例（全プロバイダー）
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
OLLAMA_MODELS=qwen3:8b,mistral:latest

# 設定
MAX_ITERATIONS=3
CONSENSUS_THRESHOLD=0.75
PARALLEL_EXECUTION=true
```

#### .env 設定例（ペルソナモード）
```env
# 単一モデル（例：Ollama）を使用して複数のペルソナをシミュレート
OLLAMA_BASE_URL=http://localhost:11434
# ペルソナモードのみ使用する場合、OLLAMA_MODELSの設定は不要です

# ペルソナ設定（セミコロン区切り）
PERSONAS=critical;creative;Einstein
# 利用可能なプリセット: critical, creative, pragmatic, optimistic, analytical, empathetic
# カスタムペルソナ名や詳細な説明も使用可能：
# PERSONAS=critical;creative;物理学者で捻くれ者で、常に斜め上からの視点で物事を考える変態
PERSONA_BASE_PROVIDER=ollama
PERSONA_BASE_MODEL=llama3.1

# オーケストレーション設定
MAX_ITERATIONS=3
CONSENSUS_THRESHOLD=0.75
PARALLEL_EXECUTION=true
```

#### .env 設定例（Ollamaのみ - テスト用）
```env
# AWS Bedrock (使用しない)
# AWS_REGION=us-east-1
# BEDROCK_MODELS=

# OpenRouter (使用しない)
# OPENROUTER_API_KEY=
# OPENROUTER_MODELS=

# Ollama Settings (テスト用)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODELS=qwen3:8b,mistral:latest

# Orchestration Settings
MAX_ITERATIONS=2
CONSENSUS_THRESHOLD=0.75
PARALLEL_EXECUTION=true
DEBUG=true
```

## クライアントへの統合

### Cursorへの統合

**方法1: .envファイルを使用（推奨）**

Cursorの MCP 設定に以下を追加します。サーバーは自動的に`.env`ファイルから設定を読み込みます：

```json
{
  "mcpServers": {
    "multi-llm": {
      "command": "node",
      "args": ["/absolute/path/to/multi_LLM_orchestration_2025/dist/server.js"]
    }
  }
}
```

**方法2: 環境変数を明示的に指定**

または、設定内で環境変数を直接指定することもできます：

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
        "CONSENSUS_THRESHOLD": "0.75",
        "PARALLEL_EXECUTION": "true",
        "DEBUG": "true"
      }
    }
  }
}
```

### Claude Desktop (Claude Code)への統合

Claude Desktopの設定ファイルを編集します：

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
- `env`セクションで指定した環境変数は`.env`ファイルの設定を上書きします

### 動作確認

Claude DesktopまたはCursorで以下のように質問してみてください：

```
orchestrate_llms ツールを使って、
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

## テスト実行

### 基本テスト
```bash
pnpm test
```

### 開発モード
```bash
pnpm dev
```

## トラブルシューティング

### better-sqlite3のビルドエラー

pnpmを使用している場合、ネイティブバインディングが自動ビルドされないことがあります：

```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
npm run build-release
cd ../../../../..
```

または再インストール：

```bash
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

`.env`ファイルに以下を追加：

```env
DEBUG=true
```

### データベースのリセット

```bash
rm -f consensus.db
```
