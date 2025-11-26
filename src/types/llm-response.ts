export interface LLMResponse {
  provider: string;
  model: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface Evaluation {
  evaluator: string; // 評価者のモデル識別子（provider:model）
  target: string;    // 被評価者のモデル識別子
  scores: {
    accuracy: number;     // 1-10
    relevance: number;    // 1-10
    completeness: number; // 1-10
    clarity: number;      // 1-10
  };
  feedback: string;
  totalScore: number;
}

export interface ConsensusResult {
  responses: LLMResponse[];
  evaluations: Evaluation[];
  winner?: LLMResponse;
  consensusReached: boolean;
  iterations: number;
}


