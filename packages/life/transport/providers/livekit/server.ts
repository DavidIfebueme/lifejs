import { getToken } from "@/transport/auth";
import {
  AudioFrame,
  AudioSource,
  AudioStream,
  LocalAudioTrack,
  type RemoteTrack,
  Room,
  RoomEvent,
  TrackPublishOptions,
  TrackSource,
  dispose,
} from "@livekit/rtc-node";
import { z } from "zod";
import { ServerTransportBase, type ServerTransportEvent } from "../base/server";

// - Config
export const livekitServerConfigSchema = z.object({
  serverUrl: z
    .string()
    .url()
    .default(process.env.LIVEKIT_SERVER_URL ?? "ws://localhost:7880"),
  apiKey: z.string().default(process.env.LIVEKIT_API_KEY ?? "devkey"),
  apiSecret: z.string().default(process.env.LIVEKIT_API_SECRET ?? "secret"),
});
export type LiveKitServerConfig<T extends "input" | "output"> = T extends "input"
  ? z.input<typeof livekitServerConfigSchema>
  : z.output<typeof livekitServerConfigSchema>;

// - Transport
export class LiveKitServerTransport extends ServerTransportBase<typeof livekitServerConfigSchema> {
  isConnected = false;
  room: Room | null = null;
  listeners: Partial<
    Record<ServerTransportEvent["type"], ((event: ServerTransportEvent) => void)[]>
  > = {};
  source = new AudioSource(16_000, 1, 1000000);

  private audioBuffer: Int16Array = new Int16Array(0);
  private readonly FRAME_DURATION_MS = 10; // 10ms frames
  private readonly SAMPLES_PER_FRAME = (16000 * this.FRAME_DURATION_MS) / 1000; // 160 samples for 10ms at 16kHz

  #flushTimeout: NodeJS.Timeout | null = null;

  constructor(config: LiveKitServerConfig<"input">) {
    super(livekitServerConfigSchema, config);
  }

  ensureConnected(
    name: string,
    connector: LiveKitServerTransport,
  ): asserts connector is LiveKitServerTransport & {
    room: Room & { localParticipant: NonNullable<Room["localParticipant"]> };
  } {
    if (!this.isConnected || !this.room?.localParticipant)
      throw new Error(
        `Calling this code (${name}) requires a connected room. Call joinRoom() first.`,
      );
  }

  // private activeAudioStreams = new Map<string, AudioStream>();

  #initializeListeners(room: Room) {
    // audio-chunk
    room.on(RoomEvent.TrackSubscribed, async (track) => {
      let isUnsubscribed = false;
      const audio = new AudioStream(track, { sampleRate: 16000 });

      // Listen for unsubscribing
      const unsubscribeHandler = (unsubscribedTrack: RemoteTrack) => {
        if (unsubscribedTrack.sid === track.sid) isUnsubscribed = true;
        room.off(RoomEvent.TrackUnsubscribed, unsubscribeHandler);
      };
      room.on(RoomEvent.TrackUnsubscribed, unsubscribeHandler);

      // Stream audio chunks until the track is unsubscribed
      for await (const frame of audio) {
        if (isUnsubscribed) break;
        for (const listener of this.listeners["audio-chunk"] ?? []) {
          listener({ type: "audio-chunk", chunk: frame.data });
        }
      }
    });
  }

  async joinRoom(roomId: string): Promise<void> {
    // If we are already connected to this room, do nothing
    if (roomId === this.room?.name) return;
    // If we are already connected to a room, leave it before
    if (this.isConnected) await this.leaveRoom();

    // Create the room and set up event listeners
    this.room = new Room();

    // Initialize listeners
    this.#initializeListeners(this.room);

    // Connect to the room and auto-subscribe to tracks
    const token = await getToken("livekit", this.config, "room-1", "agent-1");
    await this.room.connect(this.config.serverUrl, token, {
      autoSubscribe: true,
      dynacast: true,
    });
    this.isConnected = true;

    // Publish the track
    const track = LocalAudioTrack.createAudioTrack("audio", this.source);
    const options = new TrackPublishOptions();
    options.source = TrackSource.SOURCE_MICROPHONE;
    await this.room.localParticipant?.publishTrack(track, options);
  }

  async leaveRoom(): Promise<void> {
    this.ensureConnected("leaveRoom", this);
    await this.room.disconnect();
    await dispose();
    this.isConnected = false;
  }

  async streamText(
    topic: string,
  ): Promise<
    Omit<
      WritableStreamDefaultWriter<string>,
      "desiredSize" | "closed" | "ready" | "abort" | "releaseLock"
    >
  > {
    this.ensureConnected("streamText", this);
    return await this.room.localParticipant.streamText({ topic });
  }

  receiveStreamText(
    topic: string,
    callback: (iterator: AsyncIterable<string>, participantId: string) => void | Promise<void>,
  ) {
    this.ensureConnected("receiveText", this);
    this.room.registerTextStreamHandler(topic, (iterator, participantInfo) => {
      callback(iterator as unknown as AsyncIterable<string>, participantInfo.identity);
    });
  }

  on<EventType extends ServerTransportEvent["type"]>(
    type: EventType,
    callback: (data: Extract<ServerTransportEvent, { type: EventType }>) => void,
  ): void {
    if (!this.room) throw new Error("Room not connected.");
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(callback as (event: ServerTransportEvent) => void);
  }

  async flushAudioBuffer() {
    if (!this.audioBuffer?.length) return;
    const audioFrame = new AudioFrame(this.audioBuffer, 16000, 1, this.audioBuffer.length);
    try {
      await this.source.captureFrame(audioFrame);
    } catch (error) {
      console.error("Error capturing audio frame:", error);
    }
    this.audioBuffer = new Int16Array(0);
  }

  async streamAudioChunk(chunk: Int16Array) {
    this.ensureConnected("streamAudioChunk", this);

    // Clear any existing flush timeout
    if (this.#flushTimeout) clearTimeout(this.#flushTimeout);

    // Add chunk to buffer
    this.audioBuffer = this.concatenateArrays(this.audioBuffer, chunk);

    // Stream audio frames buffered by FRAME_DURATION_MS chunks
    while (this.audioBuffer.length >= this.SAMPLES_PER_FRAME) {
      const frameData = this.audioBuffer.slice(0, this.SAMPLES_PER_FRAME);
      this.audioBuffer = this.audioBuffer.slice(this.SAMPLES_PER_FRAME);

      const audioFrame = new AudioFrame(frameData, 16000, 1, this.SAMPLES_PER_FRAME);
      try {
        await this.source.captureFrame(audioFrame);
      } catch (error) {
        console.error("Error capturing audio frame:", error);
      }
    }

    // If some frames remain, flush them after 150ms
    // (this should leave enough time to most TTS providers to output next chunk)
    if (this.audioBuffer.length > 0) {
      this.#flushTimeout = setTimeout(() => this.flushAudioBuffer(), 150);
    }
  }

  private concatenateArrays(a: Int16Array, b: Int16Array): Int16Array {
    const result = new Int16Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
  }
}
