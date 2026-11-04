import { chatHandlers } from "./chats";
import { documentHandlers } from "./documents";
import { sessionHandlers } from "./sessions";
import { authHandlers } from "./auth";

export const handlers = [...authHandlers, ...sessionHandlers, ...documentHandlers, ...chatHandlers];
