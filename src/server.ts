import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ConsensusEngine } from "./orchestration/consensus-engine";
import { DocumentProcessor } from "./processing/map-reduce";
import { DB } from "./db/database";
import { Logger } from "./utils/logger";

// Create server instance
const server = new McpServer({
  name: "multi-llm-orchestrator",
  version: "1.0.0",
});

const consensusEngine = new ConsensusEngine();
const documentProcessor = new DocumentProcessor();
const db = DB.getInstance();

// Tool 1: Orchestrate LLMs (Consensus Protocol v2)
server.tool(
  "orchestrate_llms",
  "Run consensus protocol with multiple LLMs for a given prompt",
  {
    prompt: z.string().describe("The prompt to send to LLMs"),
    iterations: z.number().optional().describe("Max iterations for consensus (default: from config)"),
    parallel: z.boolean().optional().describe("Run generation in parallel (default: true)")
  },
  async ({ prompt, iterations, parallel }) => {
    try {
      // Note: iterations and parallel are loaded from config by default in ConsensusEngine,
      // but could be overridden if we extended the run method.
      // For now, we use the engine's configured defaults or whatever logic it has.
      // If overrides are needed, we should pass them to run().
      
      const result = await consensusEngine.run(prompt);
      
      return {
        content: [
          {
            type: "text",
            text: result.winner?.content || "No consensus reached or no result generated."
          },
          {
            type: "text",
            text: `\n\n--- Consensus Details ---\nIterations: ${result.iterations}\nConsensus Reached: ${result.consensusReached}\nWinner: ${result.winner?.provider}:${result.winner?.model}`
          }
        ]
      };
    } catch (error: any) {
      Logger.error("Error in orchestrate_llms:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool 2: Process Large Document (Map-Reduce)
server.tool(
  "process_document",
  "Process a large document using Map-Reduce and Consensus Protocol",
  {
    document: z.string().describe("The text content of the document"),
    task: z.string().describe("The task to perform (e.g., 'summarize', 'analyze', 'extract keywords')")
  },
  async ({ document, task }) => {
    try {
      const result = await documentProcessor.processDocument(document, task);
      
      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    } catch (error: any) {
      Logger.error("Error in process_document:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool 3: Get Consensus Details
server.tool(
  "get_consensus_details",
  "Get detailed information about a specific consensus session",
  {
    sessionId: z.string().describe("The ID of the session to retrieve")
  },
  async ({ sessionId }) => {
    try {
      const session = db.getSession(sessionId);
      if (!session) {
        return {
          content: [{ type: "text", text: "Session not found" }],
          isError: true
        };
      }

      const responses = db.getResponses(sessionId) as any[];
      const evaluations = db.getEvaluations(sessionId) as any[];
      const chunks = db.getChunks(sessionId) as any[];

      const details = {
        session,
        responseCount: responses.length,
        evaluationCount: evaluations.length,
        chunkCount: chunks.length,
        responses: responses.map(r => ({
          provider: r.provider,
          model: r.model,
          iteration: r.iteration,
          contentPreview: r.content.substring(0, 100) + "..."
        })),
        bestResponse: (session as any).result
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(details, null, 2)
          }
        ]
      };
    } catch (error: any) {
      Logger.error("Error in get_consensus_details:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  Logger.info("Multi-LLM Orchestration MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

