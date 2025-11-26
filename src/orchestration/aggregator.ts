import { Evaluation, LLMResponse, ConsensusResult } from "../types/llm-response";
import { AppConfig } from "../types/config";

export class Aggregator {
  constructor(private config: AppConfig) {}

  /**
   * 評価結果を集計し、合意形成の状態を判定する
   */
  aggregate(
    responses: LLMResponse[],
    evaluations: Evaluation[],
    iteration: number
  ): ConsensusResult {
    // モデルごとのスコアを集計
    const modelScores = new Map<string, number>();
    const modelCounts = new Map<string, number>();

    evaluations.forEach(evalItem => {
      const target = evalItem.target;
      const currentScore = modelScores.get(target) || 0;
      const currentCount = modelCounts.get(target) || 0;

      modelScores.set(target, currentScore + evalItem.totalScore);
      modelCounts.set(target, currentCount + 1);
    });

    // 平均スコア計算
    let highestScore = -1;
    let winnerModelId: string | null = null;

    // 各モデルの平均スコア（40点満点）
    const averageScores = new Map<string, number>();

    modelScores.forEach((total, modelId) => {
      const count = modelCounts.get(modelId) || 1;
      const avg = total / count;
      averageScores.set(modelId, avg);

      if (avg > highestScore) {
        highestScore = avg;
        winnerModelId = modelId;
      }
    });

    // 40点満点を1.0スケールに正規化して閾値判定
    const normalizedHighestScore = highestScore / 40.0;
    const consensusReached = normalizedHighestScore >= this.config.orchestration.consensusThreshold;

    // 勝者（最もスコアが高いレスポンス）を特定
    const winner = winnerModelId 
      ? responses.find(r => `${r.provider}:${r.model}` === winnerModelId)
      : undefined;

    return {
      responses,
      evaluations,
      winner,
      consensusReached,
      iterations: iteration
    };
  }
}

