import { BaseLLMProvider } from "./base-provider";
import { LLMResponse } from "../types/llm-response";
import { Logger } from "../utils/logger";

export interface PersonaDefinition {
  name: string;
  role: string;
  characteristics: string[];
}

export const PRESET_PERSONAS: Record<string, PersonaDefinition> = {
  critical: {
    name: "Critical Thinker",
    role: "critic and skeptic",
    characteristics: [
      "Identify logical fallacies and gaps in reasoning",
      "Question assumptions and evidence",
      "Look for potential risks and downsides"
    ]
  },
  creative: {
    name: "Creative Thinker",
    role: "innovator and idea generator",
    characteristics: [
      "Propose novel and out-of-the-box solutions",
      "Connect seemingly unrelated concepts",
      "Focus on possibilities rather than constraints"
    ]
  },
  pragmatic: {
    name: "Pragmatist",
    role: "practical implementer",
    characteristics: [
      "Focus on feasibility and real-world application",
      "Prioritize efficient and actionable solutions",
      "Consider resource constraints and implementation details"
    ]
  },
  optimistic: {
    name: "Optimist",
    role: "positive visionary",
    characteristics: [
      "Highlight benefits and opportunities",
      "Focus on positive outcomes and potential",
      "Encourage constructive progress"
    ]
  },
  analytical: {
    name: "Analyst",
    role: "data-driven analyzer",
    characteristics: [
      "Rely on facts, data, and logical deduction",
      "Break down complex problems into components",
      "Maintain objectivity and neutrality"
    ]
  },
  empathetic: {
    name: "Empathetic Thinker",
    role: "user advocate",
    characteristics: [
      "Prioritize user experience and emotional impact",
      "Consider ethical implications and human factors",
      "Ensure inclusivity and accessibility"
    ]
  }
};

export class PersonaProvider extends BaseLLMProvider {
  readonly name: string;
  private baseProvider: BaseLLMProvider;
  private persona: PersonaDefinition;

  constructor(baseProvider: BaseLLMProvider, personaIdentifier: string) {
    super();
    this.baseProvider = baseProvider;
    this.persona = this.resolvePersona(personaIdentifier);
    this.name = `${baseProvider.name}`; // Base provider name is used, persona is part of the model ID context
  }

  private resolvePersona(identifier: string): PersonaDefinition {
    // Check if it matches a preset (case-insensitive)
    const lowerId = identifier.toLowerCase();
    if (PRESET_PERSONAS[lowerId]) {
      return PRESET_PERSONAS[lowerId];
    }

    // Custom persona
    return {
      name: identifier,
      role: identifier, // Use the name as the role description for custom personas
      characteristics: [
        "Act according to your specific character/persona",
        "Provide unique insights based on your identity"
      ]
    };
  }

  async generate(model: string, prompt: string): Promise<LLMResponse> {
    // Build the system prompt with persona context
    const personaPrompt = this.buildPersonaSystemPrompt();
    
    // Combine with user prompt
    // Note: Some providers might support separate system prompts, but for compatibility
    // we prepend it to the user prompt or rely on the base provider to handle it if we could pass it.
    // Since BaseLLMProvider.generate only takes (model, prompt), we prepend.
    const fullPrompt = `${personaPrompt}\n\n${prompt}`;

    try {
      const response = await this.baseProvider.generate(model, fullPrompt);
      
      // Wrap the response to indicate it came from a persona
      // The model name in the response will be the base model, but the aggregator tracks it by the ID assigned in Factory
      return {
        ...response,
        metadata: {
          ...response.metadata,
          persona: this.persona.name
        }
      };
    } catch (error: any) {
      Logger.error(`Persona generation failed (${this.persona.name}):`, error.message);
      throw error;
    }
  }

  private buildPersonaSystemPrompt(): string {
    const chars = this.persona.characteristics.map(c => `- ${c}`).join("\n");
    return `IMPORTANT INSTRUCTION: You are acting as a specific persona in a multi-agent discussion.
    
Identity: ${this.persona.name}
Role: ${this.persona.role}

Guidelines for your response:
${chars}

Please stay in character throughout your response. Do not mention that you are an AI unless specifically asked about your nature, but assume the persona's perspective.`;
  }

  isConfigured(): boolean {
    return this.baseProvider.isConfigured();
  }
  
  getPersonaName(): string {
    return this.persona.name;
  }
}

