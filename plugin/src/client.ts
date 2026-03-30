const BASE_URL =
  process.env.ETS_DEV_CHANNEL_URL ||
  "https://ets-dev-channel.etdofresh.com";

async function request(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendMessage(chatId: string, text: string) {
  return request("/bot/sendMessage", { chat_id: chatId, text });
}

export async function editMessage(
  chatId: string,
  messageId: string,
  text: string,
) {
  return request("/bot/editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
  });
}

export async function deleteMessage(chatId: string, messageId: string) {
  return request("/bot/deleteMessage", {
    chat_id: chatId,
    message_id: messageId,
  });
}

export async function sendChatAction(chatId: string, action: string) {
  return request("/bot/sendChatAction", { chat_id: chatId, action });
}
