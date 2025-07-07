import { type EOUProviderConfig, eouProviderConfigSchema } from "@/models/eou";
import { type LLMProviderConfig, llmProviderConfigSchema } from "@/models/llm";
import { type STTProviderConfig, sttProviderConfigSchema } from "@/models/stt";
import { type TTSProviderConfig, ttsProviderConfigSchema } from "@/models/tts";
import { type VADProviderConfig, vadProviderConfigSchema } from "@/models/vad";
import {
  type ServerTransportProviderConfig,
  serverTransportProviderConfigSchema,
} from "@/transport/index.server";
import { z } from "zod";

export const configDefinitionSchema = z
  .object({
    transport: serverTransportProviderConfigSchema.default({ provider: "livekit" }),
    models: z
      .object({
        vad: vadProviderConfigSchema.default({ provider: "silero" }),
        stt: sttProviderConfigSchema.default({ provider: "deepgram" }),
        eou: eouProviderConfigSchema.default({ provider: "livekit" }),
        llm: llmProviderConfigSchema.default({ provider: "openai" }),
        tts: ttsProviderConfigSchema.default({ provider: "cartesia" }),
      })
      .default({}),
  })
  .default({});

export type ConfigDefinition<T extends "input" | "output"> = T extends "input"
  ? {
      transport?: ServerTransportProviderConfig<T>;
      models?: {
        vad?: VADProviderConfig<T>;
        stt?: STTProviderConfig<T>;
        eou?: EOUProviderConfig<T>;
        llm?: LLMProviderConfig<T>;
        tts?: TTSProviderConfig<T>;
      };
    }
  : {
      transport: ServerTransportProviderConfig<"output">;
      models: {
        vad: VADProviderConfig<"output">;
        stt: STTProviderConfig<"output">;
        eou: EOUProviderConfig<"output">;
        llm: LLMProviderConfig<"output">;
        tts: TTSProviderConfig<"output">;
      };
    };

export function defineConfig(def: ConfigDefinition<"input">) {
  const parsedConfig = configDefinitionSchema.parse(def);
  return { raw: def, withDefaults: parsedConfig };
}
