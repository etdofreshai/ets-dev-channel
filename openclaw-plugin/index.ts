import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { dispatchInboundDirectDmWithRuntime } from "openclaw/plugin-sdk/channel-inbound";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import { etsDevChannelPlugin } from "./src/channel.js";
import * as client from "./src/client.js";

const store = createPluginRuntimeStore("ets-dev-channel runtime not initialized");
let currentConfig: any = null;
let polling = false;
let offset = 0;

async function startPolling() {
  polling = true;
  console.log("[ets-dev-channel] poller started");

  while (polling) {
    try {
      const updates = await client.getUpdates(offset, 30);
      for (const update of updates) {
        const msg = update.message;
        if (!msg?.text) continue;

        const runtime = store.tryGetRuntime();
        const cfg = currentConfig;
        if (!runtime || !cfg) {
          console.warn("[ets-dev-channel] runtime or config not ready, skipping");
          continue;
        }

        try {
          await dispatchInboundDirectDmWithRuntime({
            cfg,
            runtime,
            channel: "ets-dev-channel",
            channelLabel: "ET's Dev Channel",
            accountId: "default",
            peer: {
              kind: "direct",
              id: String(msg.from.id),
            },
            senderId: String(msg.from.id),
            senderAddress: `ets-dev-channel:${msg.from.id}`,
            recipientAddress: "ets-dev-channel:bot",
            conversationLabel: msg.from.first_name || String(msg.from.id),
            rawBody: msg.text,
            messageId: String(msg.message_id),
            timestamp: msg.date * 1000,
            commandAuthorized: true,
            deliver: async (payload: any) => {
              const text = payload && typeof payload === "object" && "text" in payload
                ? String(payload.text ?? "")
                : String(payload ?? "");
              if (!text.trim()) return;
              await client.sendMessage(String(msg.chat.id), text);
            },
            onRecordError: (err) => {
              console.error("[ets-dev-channel] record error:", err);
            },
            onDispatchError: (err, info) => {
              console.error(`[ets-dev-channel] dispatch error (${info.kind}):`, err);
            },
          });
        } catch (err: any) {
          console.error(`[ets-dev-channel] dispatch error: ${err.message}`);
        }

        offset = update.update_id + 1;
      }
    } catch (err: any) {
      if (polling) {
        console.error(`[ets-dev-channel] poll error: ${err.message}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

export default defineChannelPluginEntry({
  id: "ets-dev-channel",
  name: "ET's Dev Channel",
  description: "Connect OpenClaw to ET's Dev Channel",
  plugin: etsDevChannelPlugin,
  setRuntime: (runtime: any) => {
    store.setRuntime(runtime);
  },
  registerFull(api) {
    currentConfig = api.config;
    // Start polling after a short delay to let runtime initialize
    setTimeout(() => startPolling(), 3000);
  },
});
