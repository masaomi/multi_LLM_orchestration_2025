import { z } from "zod";
import { BaseLLMProvider } from "../providers/base-provider";
import { LLMResponse, Evaluation } from "../types/llm-response";
import { Logger } from "../utils/logger";

const EvaluationSchema = z.object({
  scores: z.object({
    accuracy: z.number().min(1).max(10),
    relevance: z.number().min(1).max(10),
    completeness: z.number().min(1).max(10),
    clarity: z.number().min(1).max(10)
  }),
  feedback: z.string(),
  totalScore: z.number() // Optional in input, but we'll ensure it exists
});

export class Evaluator {
  /**
   * 指定されたLLMを使って、対象の応答を評価する
   */
  async evaluate(
    evaluatorProvider: BaseLLMProvider,
    evaluatorModel: string,
    originalPrompt: string,
    targetResponse: LLMResponse
  ): Promise<Evaluation> {
    const prompt = this.buildEvaluationPrompt(originalPrompt, targetResponse.content);

    try {
      const response = await evaluatorProvider.generate(evaluatorModel, prompt);
      return this.parseEvaluation(response.content, evaluatorModel, targetResponse.model);
    } catch (error) {
      Logger.error(`Evaluation failed by ${evaluatorModel} on ${targetResponse.model}:`, error);
      // フォールバック評価（エラー時）
      return {
        evaluator: `${evaluatorProvider.name}:${evaluatorModel}`,
        target: `${targetResponse.provider}:${targetResponse.model}`,
        scores: { accuracy: 1, relevance: 1, completeness: 1, clarity: 1 },
        feedback: "Evaluation failed due to technical error.",
        totalScore: 4
      };
    }
  }

  private buildEvaluationPrompt(originalPrompt: string, targetContent: string): string {
    return `
You are an expert evaluator. Your task is to evaluate the following response to the given prompt.
Please evaluate based on 4 criteria: Accuracy, Relevance, Completeness, and Clarity.
Score each from 1 to 10.

Original Prompt:
"${originalPrompt}"

Response to Evaluate:
"${targetContent}"

Output must be a valid JSON object with the following structure:
{
  "scores": {
    "accuracy": number,
    "relevance": number,
    "completeness": number,
    "clarity": number
  },
  "feedback": "string (constructive feedback explaining the scores)"
}

Do not include any text outside the JSON object.
`;
  }

  private parseEvaluation(content: string, evaluatorId: string, targetId: string): Evaluation {
    try {
      // JSONブロックを探す（Markdownコードブロック対応）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      
      const parsed = JSON.parse(jsonStr);
      const validated = EvaluationSchema.parse({
        ...parsed,
        totalScore: 0 // 仮の値、下で計算
      });

      const totalScore = 
        validated.scores.accuracy + 
        validated.scores.relevance + 
        validated.scores.completeness + 
        validated.scores.clarity;

      return {
        evaluator: evaluatorId,
        target: targetId,
        scores: validated.scores,
        feedback: validated.feedback,
        totalScore: totalScore
      };
    } catch (error) {
      Logger.warn(`Failed to parse evaluation JSON from ${evaluatorId}: ${content.substring(0, 100)}...`);
      throw new Error("Invalid JSON format in evaluation response");
    }
  }
}

