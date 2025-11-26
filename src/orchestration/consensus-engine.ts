import { ProviderFactory, ActiveModel } from "../providers/factory";
import { Evaluator } from "./evaluator";
import { Aggregator } from "./aggregator";
import { ConfigLoader } from "../utils/config-loader";
import { DB } from "../db/database";
import { LLMResponse, ConsensusResult } from "../types/llm-response";
import { Logger } from "../utils/logger";

export class ConsensusEngine {
  private providerFactory: ProviderFactory;
  private evaluator: Evaluator;
  private aggregator: Aggregator;
  private db: DB;
  private config = ConfigLoader.getInstance().getConfig();

  constructor() {
    this.providerFactory = new ProviderFactory();
    this.evaluator = new Evaluator();
    this.aggregator = new Aggregator(this.config);
    this.db = DB.getInstance();
  }

  /**
   * 合意形成プロセスを実行する
   */
  async run(prompt: string, sessionId?: string): Promise<ConsensusResult> {
    const activeModels = this.providerFactory.getActiveModels();
    if (activeModels.length === 0) {
      throw new Error("No active LLM models configured.");
    }

    // セッションIDがなければ新規作成
    const finalSessionId = sessionId || this.db.createSession(prompt);
    Logger.info(`Starting consensus session: ${finalSessionId} with ${activeModels.length} models`);

    let currentIteration = 1;
    let consensusResult: ConsensusResult | null = null;
    let currentPrompt = prompt;

    // 反復ループ
    while (currentIteration <= this.config.orchestration.maxIterations) {
      Logger.info(`Iteration ${currentIteration}/${this.config.orchestration.maxIterations}`);

      // 1. 生成フェーズ (並列実行)
      const responses = await this.generatePhase(activeModels, currentPrompt);
      
      // DB保存
      responses.forEach(r => {
        this.db.addResponse(finalSessionId, r.provider, r.model, r.content, currentIteration);
      });

      // 2. 評価フェーズ (並列実行 - 各モデルが他モデルを評価)
      const evaluations = await this.evaluatePhase(activeModels, responses, prompt); // 評価基準は元のプロンプト

      // DB保存
      evaluations.forEach(e => {
        const targetModel = responses.find(r => `${r.provider}:${r.model}` === e.target);
        const targetId = targetModel ? targetModel.model : e.target; // DB保存用にはモデル名などを使う
        this.db.addEvaluation(finalSessionId, e.evaluator, e.target, e.scores, e.feedback, e.totalScore, currentIteration);
      });

      // 3. 集約・判定フェーズ
      consensusResult = this.aggregator.aggregate(responses, evaluations, currentIteration);

      // 合意形成できたか、最大反復回数に達したら終了
      if (consensusResult.consensusReached || currentIteration >= this.config.orchestration.maxIterations) {
        const status = consensusResult.consensusReached ? 'completed' : 'completed'; // 最大回数到達もcompleted扱いにするが、結果にはconsensusReached=falseが含まれる
        this.db.updateSessionStatus(finalSessionId, status, consensusResult.winner?.content);
        break;
      }

      // 4. フィードバック生成（次の反復のためのプロンプト改善）
      // 最も評価の高かった回答へのフィードバックを元にプロンプトを調整するなどの処理が可能
      // ここではシンプルに、「以下のフィードバックを元に改善してください」と付与する
      if (consensusResult.winner) {
        const winnerEval = evaluations.find(e => e.target === `${consensusResult!.winner!.provider}:${consensusResult!.winner!.model}`);
        if (winnerEval) {
            currentPrompt = `${prompt}\n\nPrevious attempt feedback: ${winnerEval.feedback}\nPlease improve the answer based on this feedback.`;
        }
      }
      
      currentIteration++;
    }

    if (!consensusResult) {
        throw new Error("Consensus process failed to produce a result.");
    }

    return consensusResult;
  }

  private async generatePhase(models: ActiveModel[], prompt: string): Promise<LLMResponse[]> {
    const promises = models.map(model => 
      model.provider.generate(model.modelName, prompt)
        .catch(err => {
            Logger.error(`Generation failed for ${model.id}`, err);
            return null;
        })
    );

    const results = await Promise.all(promises);
    return results.filter((r): r is LLMResponse => r !== null);
  }

  private async evaluatePhase(models: ActiveModel[], responses: LLMResponse[], originalPrompt: string) {
    const evaluationPromises: Promise<any>[] = [];

    // 各モデル(evaluator)が、自分以外の全ての応答(target)を評価する
    for (const evaluator of models) {
      for (const target of responses) {
        // 自分自身の回答は評価しない
        if (`${target.provider}:${target.model}` === evaluator.id) continue;

        evaluationPromises.push(
          this.evaluator.evaluate(
            evaluator.provider,
            evaluator.modelName,
            originalPrompt,
            target
          )
        );
      }
    }

    const results = await Promise.all(evaluationPromises);
    return results;
  }
}


