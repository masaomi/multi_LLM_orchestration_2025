import { ConsensusEngine } from "../orchestration/consensus-engine";
import { Chunker } from "./chunker";
import { DB } from "../db/database";
import { Logger } from "../utils/logger";

export class DocumentProcessor {
  private consensusEngine: ConsensusEngine;
  private chunker: Chunker;
  private db: DB;

  constructor() {
    this.consensusEngine = new ConsensusEngine();
    // コンテキストウィンドウの余裕を持たせて4000トークンで分割
    this.chunker = new Chunker(4000, 200); 
    this.db = DB.getInstance();
  }

  /**
   * ドキュメントを処理する（必要なら分割してMap-Reduce）
   */
  async processDocument(document: string, task: string): Promise<string> {
    const tokenCount = this.chunker.countTokens(document);
    Logger.info(`Processing document with ${tokenCount} tokens.`);

    // セッションID作成（親セッション）
    const sessionId = this.db.createSession(`[Document Processing] ${task}`);

    // 8000トークン以下ならそのまま処理（概算）
    if (tokenCount <= 8000) {
      Logger.info("Document fits in context, running direct consensus.");
      const prompt = `${task}\n\nDocument:\n${document}`;
      const result = await this.consensusEngine.run(prompt, sessionId);
      return result.winner?.content || "No result generated.";
    }

    // Map Phase: チャンク分割と並列処理
    Logger.info("Document too large, starting Map-Reduce process.");
    const chunks = this.chunker.split(document);
    Logger.info(`Split into ${chunks.length} chunks.`);

    // 各チャンクをDBに保存し、IDを取得
    const chunksWithId = chunks.map(chunk => {
        const id = this.db.addChunk(sessionId, chunk.index, chunk.content, chunk.tokenCount);
        return { ...chunk, id };
    });

    // 各チャンクを並列処理
    const mapPromises = chunksWithId.map(async (chunk) => {
      const chunkPrompt = `
You are processing a part of a larger document.
Task: ${task}

Content Part ${chunk.index + 1}/${chunks.length}:
${chunk.content}

Provide the result for this part only.
`;
      
      try {
        // チャンク処理用のサブセッションを作成することも可能だが、
        // ここでは独立した実行として扱う
        const chunkResult = await this.consensusEngine.run(chunkPrompt);
        const content = chunkResult.winner?.content || "";
        
        // チャンク結果をDB更新
        this.db.updateChunkResult(chunk.id, content);
        
        return content;
      } catch (error) {
        Logger.error(`Failed to process chunk ${chunk.index}`, error);
        return "[Processing Error]";
      }
    });

    const mapResults = await Promise.all(mapPromises);

    // Reduce Phase: 統合
    Logger.info("Map phase completed, starting Reduce phase.");
    const reducePrompt = `
Here are the results from processing parts of a document.
Please combine them into a coherent final output according to the original task.

Task: ${task}

Partial Results:
${mapResults.map((res, i) => `--- Part ${i + 1} ---\n${res}`).join('\n\n')}

Final Output:
`;

    const finalResult = await this.consensusEngine.run(reducePrompt, sessionId);
    return finalResult.winner?.content || "Failed to generate final result.";
  }
}

