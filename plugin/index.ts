import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { etsDevChannelPlugin } from "./src/channel.js";

export default defineChannelPluginEntry({
  id: "ets-dev-channel",
  name: "ET's Dev Channel",
  description: "Connect OpenClaw to ET's Dev Channel",
  plugin: etsDevChannelPlugin,
  registerFull(api) {
    // Inbound webhook: receives messages from the Express backend
    api.registerHttpRoute({
      path: "/ets-dev-channel/webhook",
      auth: "plugin",
      handler: async (req, res) => {
        let body = "";
        for await (const chunk of req) body += chunk;
        const event = JSON.parse(body);

        // Dispatch inbound message to OpenClaw
        // The Express backend POSTs: { chat_id, message_id, from, text }
        if (event.text && event.from) {
          await (api as any).dispatchInboundMessage?.({
            channel: "ets-dev-channel",
            chatId: String(event.chat_id),
            messageId: String(event.message_id),
            from: {
              id: String(event.from.id || event.from),
              name: event.from.name || event.from.username || String(event.from),
            },
            text: event.text,
          });
        }

        res.statusCode = 200;
        res.end("ok");
        return true;
      },
    });
  },
});
