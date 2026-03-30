# ET's Dev Channel — OpenClaw Plugin

OpenClaw channel plugin that connects to ET's Dev Channel web app.

## Install

```bash
openclaw plugins install @etdofreshai/openclaw-ets-dev-channel
```

Or for local development, add the plugin path to your OpenClaw config:

```json5
{
  plugins: {
    entries: {
      "ets-dev-channel": {
        enabled: true,
        path: "/path/to/ets-dev-channel/plugin"
      }
    }
  }
}
```

## Configuration

Add to your OpenClaw config (`channels` section):

```json5
{
  channels: {
    "ets-dev-channel": {
      enabled: true,
      url: "https://ets-dev-channel.etdofresh.com",
      token: "your-bot-token",
      allowFrom: ["user1", "user2"],
      dmPolicy: "allowlist"
    }
  }
}
```

## How it works

- **Outbound** (OpenClaw → Dev Channel): The plugin POSTs to the Express backend's bot API (`/bot/sendMessage`, `/bot/editMessageText`, `/bot/deleteMessage`, `/bot/sendChatAction`).
- **Inbound** (Dev Channel → OpenClaw): The Express backend POSTs user messages to the plugin's webhook at `/ets-dev-channel/webhook`.

## Environment Variables

- `ETS_DEV_CHANNEL_URL` — Override the base URL (default: `https://ets-dev-channel.etdofresh.com`)
