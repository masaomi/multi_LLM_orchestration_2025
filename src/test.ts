import { ConsensusEngine } from './orchestration/consensus-engine';

async function test() {
  console.log('=== Multi-LLM Orchestration Test ===\n');
  
  const engine = new ConsensusEngine();
  
  const prompt = "愛とはなんですか？";
  
  console.log(`Prompt: ${prompt}\n`);
  console.log('Starting consensus process...\n');
  
  try {
    const result = await engine.run(prompt);
    
    console.log('\n=== Results ===');
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Consensus Reached: ${result.consensusReached}`);
    console.log(`Number of Responses: ${result.responses.length}`);
    console.log(`Number of Evaluations: ${result.evaluations.length}\n`);
    
    console.log('--- All Responses ---');
    result.responses.forEach((r, i) => {
      console.log(`\n[${i + 1}] ${r.provider}:${r.model}`);
      console.log(r.content);
    });
    
    console.log('\n--- Evaluations Summary ---');
    result.evaluations.forEach((e, i) => {
      console.log(`\n[${i + 1}] ${e.evaluator} evaluating ${e.target}`);
      console.log(`Scores: Accuracy=${e.scores.accuracy}, Relevance=${e.scores.relevance}, Completeness=${e.scores.completeness}, Clarity=${e.scores.clarity}`);
      console.log(`Total: ${e.totalScore}/40`);
    });
    
    if (result.winner) {
      console.log('\n--- Winner (Best Response) ---');
      console.log(`Provider: ${result.winner.provider}:${result.winner.model}`);
      console.log(`\nContent:\n${result.winner.content}`);
    }
    
    console.log('\n=== Test Completed Successfully ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();

