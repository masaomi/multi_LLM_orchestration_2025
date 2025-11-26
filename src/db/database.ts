import Database from 'better-sqlite3';
import { schema } from './schema';
import path from 'path';
import fs from 'fs';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class DB {
  private static instance: DB;
  private db: Database.Database;

  private constructor() {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'consensus.db');
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initSchema();
  }

  public static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  }

  private initSchema() {
    try {
      this.db.exec(schema);
    } catch (error) {
      Logger.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  // Session operations
  public createSession(prompt: string): string {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO consensus_sessions (id, prompt, status, created_at)
      VALUES (?, ?, 'running', ?)
    `);
    stmt.run(id, prompt, new Date().toISOString());
    return id;
  }

  public updateSessionStatus(id: string, status: string, result?: string) {
    const completedAt = status === 'completed' || status === 'failed' ? new Date().toISOString() : null;
    const stmt = this.db.prepare(`
      UPDATE consensus_sessions 
      SET status = ?, result = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(status, result || null, completedAt, id);
  }

  public getSession(id: string) {
    const stmt = this.db.prepare('SELECT * FROM consensus_sessions WHERE id = ?');
    return stmt.get(id);
  }

  // Response operations
  public addResponse(sessionId: string, provider: string, model: string, content: string, iteration: number) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO responses (id, session_id, provider, model, content, iteration, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, sessionId, provider, model, content, iteration, new Date().toISOString());
    return id;
  }

  public getResponses(sessionId: string, iteration?: number) {
    let query = 'SELECT * FROM responses WHERE session_id = ?';
    const params: any[] = [sessionId];
    
    if (iteration !== undefined) {
      query += ' AND iteration = ?';
      params.push(iteration);
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Evaluation operations
  public addEvaluation(sessionId: string, evaluatorId: string, targetId: string, scores: any, feedback: string, totalScore: number, iteration: number) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO evaluations (id, session_id, evaluator_id, target_id, scores, feedback, total_score, iteration, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, sessionId, evaluatorId, targetId, JSON.stringify(scores), feedback, totalScore, iteration, new Date().toISOString());
    return id;
  }

  public getEvaluations(sessionId: string, iteration?: number) {
    let query = 'SELECT * FROM evaluations WHERE session_id = ?';
    const params: any[] = [sessionId];
    
    if (iteration !== undefined) {
      query += ' AND iteration = ?';
      params.push(iteration);
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Chunk operations
  public addChunk(sessionId: string, chunkIndex: number, content: string, tokenCount: number) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO chunks (id, session_id, chunk_index, content, token_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, sessionId, chunkIndex, content, tokenCount, new Date().toISOString());
    return id;
  }

  public updateChunkResult(chunkId: string, result: string) {
    const stmt = this.db.prepare('UPDATE chunks SET result = ? WHERE id = ?');
    stmt.run(result, chunkId);
  }

  public getChunks(sessionId: string) {
    const stmt = this.db.prepare('SELECT * FROM chunks WHERE session_id = ? ORDER BY chunk_index ASC');
    return stmt.all(sessionId);
  }
}

