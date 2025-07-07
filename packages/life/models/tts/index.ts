import { z } from "zod";
import { CartesiaTTS, cartesiaTTSConfigSchema } from "./providers/cartesia";
import { GroqTTS, groqTTSConfigSchema } from "./providers/groq";

// Providers
export const ttsProviders = {
  cartesia: { class: CartesiaTTS, configSchema: cartesiaTTSConfigSchema },
  groq: { class: GroqTTS, configSchema: groqTTSConfigSchema },
} as const;

export type TTSProvider = (typeof ttsProviders)[keyof typeof ttsProviders]["class"];

// Config
export type TTSProviderConfig<T extends "input" | "output"> = {
  [K in keyof typeof ttsProviders]: { provider: K } & (T extends "input"
    ? z.input<(typeof ttsProviders)[K]["configSchema"]>
    : z.output<(typeof ttsProviders)[K]["configSchema"]>);
}[keyof typeof ttsProviders];

export const ttsProviderConfigSchema = z.discriminatedUnion(
  "provider",
  Object.entries(ttsProviders).map(([key, { configSchema }]) =>
    configSchema.extend({ provider: z.literal(key) }),
  ) as unknown as [
    z.ZodObject<{ provider: z.ZodString }>,
    ...z.ZodObject<{ provider: z.ZodString }>[],
  ],
);
