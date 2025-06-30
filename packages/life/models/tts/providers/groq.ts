import { z } from "zod";
import { TTSBase, type TTSGenerateJob } from "../base";

export const groqTTSConfigSchema = z.object({
  apiKey: z.string().default(process.env.GROQ_API_KEY ?? ""),
  voice: z.string().default("alloy"),
  model: z.string().default("tts-1"),
  speed: z.number().min(0.25).max(4).default(1),
  language: z.string().optional(),
});

export class GroqTTS extends TTSBase<typeof groqTTSConfigSchema> {
  #apiKey: string;
  #voice: string;
  #model: string;
  #speed: number;
  #language?: string;

  constructor(config: z.input<typeof groqTTSConfigSchema>) {
    super(groqTTSConfigSchema, config);
    if (!this.config.apiKey)
      throw new Error(
        "GROQ_API_KEY environment variable or config.apiKey must be provided to use this model."
      );
    this.#apiKey = this.config.apiKey;
    this.#voice = this.config.voice;
    this.#model = this.config.model;
    this.#speed = this.config.speed;
    this.#language = this.config.language;
  }

  async generate(): Promise<TTSGenerateJob> {
    const job = this.createGenerateJob();
    return job;
  }

  protected async _onGeneratePushText(job: TTSGenerateJob, text: string): Promise<void> {
    const url = "https://api.groq.com/openai/tts";
    const body: Record<string, any> = {
      model: this.#model,
      voice: this.#voice,
      speed: this.#speed,
      input: text,
    };
    if (this.#language) body.language = this.#language;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.#apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      job.raw.receiveChunk({ type: "error", error: `Groq TTS error: ${response.statusText}` });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const pcmBytes = new Int16Array(arrayBuffer);
    job.raw.receiveChunk({ type: "content", voiceChunk: pcmBytes });
    job.raw.receiveChunk({ type: "end" });
  }
}
