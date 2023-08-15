// @ts-ignore
import { pipeline } from "@xenova/transformers";

export class Embedding {
  private pipe: any;

  constructor(model = "Supabase/gte-small") {
    this.pipe = pipeline("feature-extraction", model);
  }

  async embed(
    text: string,
    options = { pooling: "mean", normalize: true }
  ): Promise<number[]> {
    const output = await this.pipe(text, options);
    return Array.from(output.data);
  }
}
