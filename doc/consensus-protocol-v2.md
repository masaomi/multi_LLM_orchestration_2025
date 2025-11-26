# Consensus Protocol v2

## Overview

Consensus Protocol v2 is a multi-LLM orchestration framework that achieves high-quality AI responses through automated generation, mutual evaluation, and consensus formation across multiple Large Language Models (LLMs).

## Core Concepts

### Multi-Agent Consensus

Instead of relying on a single LLM's response, Consensus Protocol v2 leverages multiple LLMs (or multiple personas on a single LLM) to:

1. **Generate** diverse responses to the same prompt
2. **Evaluate** each other's responses objectively
3. **Aggregate** scores to identify the best response
4. **Iterate** with feedback until consensus is reached

This approach mitigates individual model biases and produces more reliable, well-rounded outputs.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Consensus Protocol v2                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   LLM A      │    │   LLM B      │    │   LLM C      │      │
│  │  (or Persona)│    │  (or Persona)│    │  (or Persona)│      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Generation Phase                        │       │
│  │         (Parallel response generation)               │       │
│  └─────────────────────────┬───────────────────────────┘       │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Evaluation Phase                        │       │
│  │      (Cross-evaluation: each evaluates others)       │       │
│  └─────────────────────────┬───────────────────────────┘       │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Aggregation Phase                       │       │
│  │    (Score aggregation & consensus determination)     │       │
│  └─────────────────────────┬───────────────────────────┘       │
│                            │                                    │
│              ┌─────────────┴─────────────┐                     │
│              │                           │                      │
│              ▼                           ▼                      │
│     ┌────────────────┐          ┌────────────────┐             │
│     │   Consensus    │          │  No Consensus  │             │
│     │    Reached     │          │   (Iterate)    │             │
│     └────────┬───────┘          └────────┬───────┘             │
│              │                           │                      │
│              ▼                           ▼                      │
│     ┌────────────────┐          ┌────────────────┐             │
│     │ Return Winner  │          │ Feedback Loop  │             │
│     └────────────────┘          └────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Protocol Phases

### Phase 1: Generation

All configured LLMs (or personas) receive the same prompt and generate responses in parallel.

**Input:** User prompt  
**Output:** Array of LLM responses

```typescript
interface LLMResponse {
  provider: string;    // e.g., "ollama", "openrouter", "bedrock"
  model: string;       // e.g., "llama3.1", "gpt-4-turbo"
  content: string;     // Generated response
  metadata?: object;   // Provider-specific metadata
}
```

### Phase 2: Evaluation

Each LLM evaluates all other LLMs' responses (not its own) based on four criteria:

| Criterion | Description | Score Range |
|-----------|-------------|-------------|
| **Accuracy** | Factual correctness and truthfulness | 1-10 |
| **Relevance** | How well the response addresses the prompt | 1-10 |
| **Completeness** | Coverage of all aspects of the question | 1-10 |
| **Clarity** | Clear, well-structured communication | 1-10 |

**Total Score:** 4-40 points per evaluation

```typescript
interface Evaluation {
  evaluator: string;   // Model that performed the evaluation
  target: string;      // Model being evaluated
  scores: {
    accuracy: number;
    relevance: number;
    completeness: number;
    clarity: number;
  };
  feedback: string;    // Constructive feedback
  totalScore: number;  // Sum of all scores (4-40)
}
```

### Phase 3: Aggregation

Scores from all evaluators are aggregated for each response:

1. Calculate average score per response
2. Normalize to 0-1 scale (divide by 40)
3. Compare against consensus threshold
4. Identify winner (highest average score)

**Consensus Determination:**
```
normalizedScore = averageScore / 40.0
consensusReached = normalizedScore >= consensusThreshold
```

Default threshold: `0.75` (configurable)

### Phase 4: Iteration (if no consensus)

If consensus is not reached:

1. Extract feedback from the highest-scoring response's evaluation
2. Append feedback to the original prompt
3. Return to Phase 1 with enhanced prompt
4. Repeat until consensus or max iterations reached

## Configuration Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `MAX_ITERATIONS` | Maximum consensus attempts | 3 |
| `CONSENSUS_THRESHOLD` | Minimum normalized score (0-1) | 0.75 |
| `PARALLEL_EXECUTION` | Run generation/evaluation in parallel | true |

## Supported Providers

### Standard Providers
- **AWS Bedrock** - Claude, Titan, and other models
- **OpenRouter** - Access to multiple model providers
- **Ollama** - Local model execution

### Persona-based Mode
When limited to a single model, persona-based agent ensemble can simulate multiple perspectives:

- **Critical Thinker** - Identifies flaws and logical gaps
- **Creative Thinker** - Proposes novel solutions
- **Pragmatist** - Focuses on practical implementation
- **Optimist** - Highlights opportunities and benefits
- **Analyst** - Data-driven, objective analysis
- **Empathetic Thinker** - User-centric perspective

Custom personas can also be defined (e.g., "Einstein", "Sherlock Holmes").

## Use Cases

1. **Complex Decision Making** - Get balanced perspectives on difficult questions
2. **Content Generation** - Higher quality through peer review
3. **Code Review** - Multiple AI perspectives on code quality
4. **Research Synthesis** - Combining diverse analytical approaches
5. **Educational Content** - Ensuring accuracy through cross-validation

## Map-Reduce Processing

For documents exceeding context windows, the protocol supports Map-Reduce:

1. **Chunk** - Split document into manageable pieces
2. **Map** - Process each chunk through consensus protocol
3. **Reduce** - Aggregate chunk results into final output

## Best Practices

1. **Minimum 2 Models/Personas** - Cross-evaluation requires at least 2 participants
2. **Diverse Perspectives** - Use different models or varied personas for better coverage
3. **Appropriate Thresholds** - Adjust consensus threshold based on task criticality
4. **Iteration Limits** - Balance quality with response time via max iterations

## API Reference

### ConsensusEngine

```typescript
class ConsensusEngine {
  // Execute consensus protocol
  async run(prompt: string, sessionId?: string): Promise<ConsensusResult>;
}

interface ConsensusResult {
  responses: LLMResponse[];      // All generated responses
  evaluations: Evaluation[];     // All evaluations
  winner?: LLMResponse;          // Best response (if any)
  consensusReached: boolean;     // Whether threshold was met
  iterations: number;            // Number of iterations performed
}
```

## Version History

| Version | Changes |
|---------|---------|
| v2.0 | Persona-based agent ensemble support |
| v1.0 | Initial multi-LLM consensus protocol |

