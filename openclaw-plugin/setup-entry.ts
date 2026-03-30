import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
import { etsDevChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(etsDevChannelPlugin);
