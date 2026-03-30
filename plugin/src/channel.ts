import {
  createChatChannelPlugin,
  createChannelPluginBase,
} from "openclaw/plugin-sdk/core";
import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
import * as client from "./client.js";

type ResolvedAccount = {
  accountId: string | null;
  token: string;
  url: string;
  allowFrom: string[];
  dmPolicy: string | undefined;
};

function resolveAccount(
  cfg: OpenClawConfig,
  accountId?: string | null,
): ResolvedAccount {
  const section = (cfg.channels as Record<string, any>)?.["ets-dev-channel"];
  const token = section?.token ?? "";
  const url =
    section?.url || "https://ets-dev-channel.etdofresh.com";
  return {
    accountId: accountId ?? null,
    token,
    url,
    allowFrom: section?.allowFrom ?? [],
    dmPolicy: section?.dmPolicy,
  };
}

export const etsDevChannelPlugin = createChatChannelPlugin<ResolvedAccount>({
  base: createChannelPluginBase({
    id: "ets-dev-channel",
    setup: {
      resolveAccount,
      inspectAccount(cfg) {
        const section =
          (cfg.channels as Record<string, any>)?.["ets-dev-channel"];
        return {
          enabled: Boolean(section?.enabled),
          configured: Boolean(section?.url || section?.token),
          tokenStatus: section?.token ? "available" : "missing",
        };
      },
    },
  }),

  security: {
    dm: {
      channelKey: "ets-dev-channel",
      resolvePolicy: (account) => account.dmPolicy,
      resolveAllowFrom: (account) => account.allowFrom,
      defaultPolicy: "allowlist",
    },
  },

  threading: { topLevelReplyToMode: "reply" },

  outbound: {
    attachedResults: {
      sendText: async (params) => {
        const result = await client.sendMessage(params.to, params.text);
        return { messageId: result?.message_id ?? result?.id };
      },
    },
    base: {
      sendMedia: async (params) => {
        // Placeholder: send media URL as text for now
        const url = (params as any).url || (params as any).filePath || "";
        await client.sendMessage(
          params.to,
          `[media] ${url}`,
        );
      },
    },
  },
});
