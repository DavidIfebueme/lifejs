import type { Message, ToolDefinition } from "@/agent/resources";
import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/index.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { LLMBase, type LLMGenerateMessageJob } from "../base";

export const xaiLLMConfigSchema = z.object({
  apiKey: z.string().default(process.env.XAI_API_KEY ?? ""),
  model: z
    .enum([
      "grok-3",
      "grok-3-fast",
      "grok-3-mini",
      "grok-3-mini-fast",
      "grok-2-1212",
      "grok-2-vision-1212",
      "grok-beta",
      "grok-vision-beta",
    ])
    .default("grok-3-mini"),
  temperature: z.number().min(0).max(2).default(0.5),
});

export class XaiLLM extends LLMBase<typeof xaiLLMConfigSchema> {
  #client: OpenAI;

  constructor(config: z.input<typeof xaiLLMConfigSchema>) {
    super(xaiLLMConfigSchema, config);
    if (!config.apiKey)
      throw new Error(
        "XAI_API_KEY environment variable or config.apiKey must be provided to use this model.",
      );
    this.#client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: "https://api.x.ai/v1",
    });
  }

  /**
   * Format conversion
   */

  #toOpenAIMessage(message: Message): ChatCompletionMessageParam {
    if (message.role === "user") {
      return { role: "user", content: message.content };
    }

    if (message.role === "agent") {
      return {
        role: "assistant",
        content: message.content,
        tool_calls: message.toolsRequests?.map((request) => ({
          id: request.id,
          function: { name: request.id, arguments: JSON.stringify(request.input) },
          type: "function",
        })),
      };
    }

    if (message.role === "system") {
      return { role: "system", content: message.content };
    }

    if (message.role === "tool-response") {
      return {
        role: "tool",
        tool_call_id: message.id,
        content: JSON.stringify(message.output),
      };
    }

    return null as never;
  }

  #toOpenAIMessages(messages: Message[]): ChatCompletionMessageParam[] {
    return messages.map(this.#toOpenAIMessage);
  }

  #toOpenAITool(tool: ToolDefinition): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: "function",
      function: {
        name: tool.id,
        description: tool.description,
        parameters: zodToJsonSchema(tool.inputSchema),
      },
    };
  }

  #toOpenAITools(tools: ToolDefinition[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return tools.map(this.#toOpenAITool);
  }

  async generateMessage(
    params: Parameters<typeof LLMBase.prototype.generateMessage>[0],
  ): Promise<LLMGenerateMessageJob> {
    const job = this.createGenerateMessageJob();

    const openaiTools = params.tools.length > 0 ? this.#toOpenAITools(params.tools) : undefined;
    const openaiMessages = this.#toOpenAIMessages(params.messages);

    const stream = await this.#client.chat.completions.create(
      {
        model: this.config.model,
        temperature: this.config.temperature,
        messages: openaiMessages,
        tools: openaiTools,
        stream: true,
        ...(openaiTools?.length
          ? {
              tools: openaiTools,
              parallel_tool_calls: true,
            }
          : {}),
      },
      { signal: job.raw.abortController.signal },
    );

    let pendingToolCalls: Record<
      string,
      {
        id: string;
        name: string;
        arguments: string;
      }
    > = {};

    for await (const chunk of stream) {
      if (job.raw.abortController.signal.aborted) continue;

      const choice = chunk.choices[0];
      if (!choice) throw new Error("No choice");
      const delta = choice.delta;

      if (delta.content) {
        job.raw.receiveChunk({ type: "content", content: delta.content });
        continue;
      }

      // Handle tool calls tokens
      if (delta.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          // Retrieve the tool call ID
          const id = toolCall.id ?? Object.keys(pendingToolCalls).at(-1);
          if (!id) throw new Error("No tool call ID");

          // Ensure the tool call is tracked
          if (!pendingToolCalls[id]) pendingToolCalls[id] = { id, name: "", arguments: "" };

          // Compound name tokens
          if (toolCall.function?.name) pendingToolCalls[id].name += toolCall.function.name;

          // Compound arguments tokens
          if (toolCall.function?.arguments)
            pendingToolCalls[id].arguments += toolCall.function.arguments;
        }
      }

      // Handle tool call completion
      if (chunk.choices[0]?.finish_reason === "tool_calls") {
        for (const toolCall of Object.values(pendingToolCalls)) {
          job.raw.receiveChunk({
            type: "tool",
            toolId: toolCall.id,
            toolInput: JSON.parse(toolCall.arguments || "{}"),
          });
        }
        pendingToolCalls = {};
      }
      // Handle end of generation
      if (chunk.choices[0]?.finish_reason === "stop") job.raw.receiveChunk({ type: "end" });
    }

    return job;
  }

  async generateObject(
    params: Parameters<typeof LLMBase.prototype.generateObject>[0],
  ): ReturnType<typeof LLMBase.prototype.generateObject> {
    const openaiMessages = this.#toOpenAIMessages(params.messages);

    // Prepare JSON schema
    const { definitions } = zodToJsonSchema(params.schema, { name: "schema" });
    const schema = definitions?.schema;

    const response = await this.#client.chat.completions.create({
      model: this.config.model,
      messages: openaiMessages,
      temperature: this.config.temperature,
      response_format: {
        type: "json_schema",
        json_schema: { name: "avc", schema },
      },
    });

    const obj = JSON.parse(response.choices[0]?.message?.content || "{}");

    return { success: true, data: obj };
  }
}
