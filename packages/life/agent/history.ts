import {
  type CreateMessageInput,
  type Message,
  type ToolRequest,
  type UpdateMessageInput,
  createMessageInputSchema,
  updateMessageInputSchema,
} from "./resources";

/**
 * A helper class aimed at facilitating safe manipulation of an array of messages.
 */
export class History {
  #messages: Message[] = [];

  constructor(messages: Message[]) {
    this.#messages = messages;
  }

  generateId() {
    return crypto.randomUUID();
  }

  getMessage(id: string) {
    return this.#messages.find((message) => message.id === id);
  }

  getMessages() {
    return this.#messages;
  }

  findLastMessageIdOfRole(role: Message["role"]) {
    return [...this.#messages].reverse().find((message) => message.role === role)?.id;
  }

  createMessage(message: CreateMessageInput) {
    // Validate the message input
    const validatedMessage = createMessageInputSchema.safeParse(message);
    if (!validatedMessage.success)
      throw new Error(`Invalid message: ${validatedMessage.error.message}`);

    // If the message has no id, generate one
    if (!message.id) message.id = this.generateId();

    // If the message already exists, throw an error
    if (this.getMessage(message.id))
      throw new Error(`Message with id ${message.id} already exists.`);

    // Else, create and insert the message
    const newMessage = {
      ...message,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    } as Message;
    this.#messages.push(newMessage);

    // Return the message id
    return newMessage.id;
  }

  updateMessage(message: UpdateMessageInput) {
    const validatedMessage = updateMessageInputSchema.safeParse(message);
    if (!validatedMessage.success)
      throw new Error(`Invalid message: ${validatedMessage.error.message}`);
    const existingMessage = this.getMessage(message.id);
    if (!existingMessage) throw new Error(`Message with id ${message.id} does not exist.`);
    const updatedMessage = {
      ...existingMessage,
      ...message,
      lastUpdated: Date.now(),
    } as Message;
    this.#messages = this.#messages.map((m) => (m.id === message.id ? updatedMessage : m));
  }

  addToolRequestToAgentMessage(messageId: string, request: ToolRequest) {
    const message = this.getMessage(messageId);
    if (!message) throw new Error(`Message with id ${messageId} does not exist.`);
    if (message.role !== "agent")
      throw new Error(`Message with id ${messageId} is not an agent message.`);
    if (!message.toolsRequests) message.toolsRequests = [];
    message.toolsRequests.push(request);
    message.lastUpdated = Date.now();
  }

  appendContentToUserMessage(messageId: string, content: string) {
    const existingMessage = this.getMessage(messageId);
    if (!existingMessage) throw new Error(`Message with id ${messageId} does not exist.`);
    if (existingMessage.role !== "user")
      throw new Error(`Message with id ${messageId} is not a user message.`);
    existingMessage.content += content;
    existingMessage.lastUpdated = Date.now();
    return existingMessage.id;
  }

  appendContentToAgentMessage(messageId: string, content: string) {
    const existingMessage = this.getMessage(messageId);
    if (!existingMessage) throw new Error(`Message with id ${messageId} does not exist.`);
    if (existingMessage.role !== "agent")
      throw new Error(`Message with id ${messageId} is not an agent message.`);
    existingMessage.content += content;
    existingMessage.lastUpdated = Date.now();
    return existingMessage.id;
  }
}
