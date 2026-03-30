import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { etsDevChannelPlugin } from "./src/channel.js";
import * as client from "./src/client.js";

export default defineChannelPluginEntry({
  id: "ets-dev-channel",
  name: "ET's Dev Channel",
  description: "Connect OpenClaw to ET's Dev Channel",
  plugin: etsDevChannelPlugin,
  registerFull(api) {
    let polling = true;
    let offset = 0;

    // Long-polling loop — mirrors how Telegram plugin works
    async function poll() {
      while (polling) {
        try {
          const updates = await client.getUpdates(offset, 30);
          for (const update of updates) {
            const msg = update.message;
            if (!msg?.text) continue;

            // Dispatch inbound message to OpenClaw
            await (api as any).dispatchInbound?.({
              channel: "ets-dev-channel",
              accountId: "default",
              chatId: String(msg.chat.id),
              chatType: "direct",
              messageId: String(msg.message_id),
              senderId: String(msg.from.id),
              senderName: msg.from.first_name || msg.from.id,
              text: msg.text,
              timestamp: msg.date * 1000,
            });

            offset = update.update_id + 1;
          }
        } catch (err: any) {
          // Network error or timeout — retry after delay
          if (polling) {
            console.error(`[ets-dev-channel] poll error: ${err.message}`);
            await new Promise((r) => setTimeout(r, 5000));
          }
        }
      }
    }

    // Start polling
    poll().catch((err) => console.error("[ets-dev-channel] poll crashed:", err));

    // Cleanup on shutdown
    api.onShutdown?.(() => {
      polling = false;
    });
  },
});
