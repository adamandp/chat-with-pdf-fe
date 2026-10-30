import { chatHandlers } from "./chats";
import { documentHandlers } from "./documents";
import { sessionHandlers } from "./sessions";

export const handlers = [...sessionHandlers, ...documentHandlers, ...chatHandlers];
