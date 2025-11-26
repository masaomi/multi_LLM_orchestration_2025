import { get_encoding, encoding_for_model } from "tiktoken";

export class Chunker {
  private encoder;
  private readonly chunkSize: number;
  private readonly overlap: number;

  constructor(chunkSize: number = 4000, overlap: number = 200) {
    this.chunkSize = chunkSize;
    this.overlap = overlap;
    // cl100k_base is used by GPT-4 and GPT-3.5-turbo
    // Claude uses a different tokenizer but this is a good approximation
    this.encoder = get_encoding("cl100k_base");
  }

  public countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  public split(text: string): { content: string; tokenCount: number; index: number }[] {
    const tokens = this.encoder.encode(text);
    const chunks: { content: string; tokenCount: number; index: number }[] = [];

    if (tokens.length <= this.chunkSize) {
        chunks.push({
            content: text,
            tokenCount: tokens.length,
            index: 0
        });
        return chunks;
    }

    let start = 0;
    let chunkIndex = 0;

    while (start < tokens.length) {
      const end = Math.min(start + this.chunkSize, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      const chunkText = new TextDecoder().decode(this.encoder.decode(chunkTokens));
      
      chunks.push({
        content: chunkText,
        tokenCount: chunkTokens.length,
        index: chunkIndex++
      });

      start += this.chunkSize - this.overlap;
    }

    return chunks;
  }

  public free() {
    this.encoder.free();
  }
}

