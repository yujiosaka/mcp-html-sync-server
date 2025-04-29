import type { Script, Stylesheet } from "./page.js";

export const MessageType = {
  Removed: "removed",
  Expired: "expired",
  Updated: "updated",
  ScriptsAdded: "scripts_added",
  StylesheetsAdded: "stylesheets_added",
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const MessageReason = {
  Removed: "This page has been removed",
  Expired: "This page has expired",
} as const;
export type MessageReason = (typeof MessageReason)[keyof typeof MessageReason];

interface BaseMessage {
  type: MessageType;
}

export interface RemovedMessage extends BaseMessage {
  type: typeof MessageType.Removed;
  message: string;
}

export interface ExpiredMessage extends BaseMessage {
  type: typeof MessageType.Expired;
  message: string;
}

export interface UpdatedMessage extends BaseMessage {
  type: typeof MessageType.Updated;
  body: string;
}

export interface ScriptsAddedMessage extends BaseMessage {
  type: typeof MessageType.ScriptsAdded;
  scripts: Script[];
}

export interface StylesheetsAddedMessage extends BaseMessage {
  type: typeof MessageType.StylesheetsAdded;
  stylesheets: Stylesheet[];
}

export type PageMessage =
  | RemovedMessage
  | ExpiredMessage
  | UpdatedMessage
  | ScriptsAddedMessage
  | StylesheetsAddedMessage;

export const MessageFactory = {
  removed(reason = MessageReason.Removed): RemovedMessage {
    return { type: MessageType.Removed, message: reason };
  },

  expired(reason = MessageReason.Expired): ExpiredMessage {
    return { type: MessageType.Expired, message: reason };
  },

  updated(body: string): UpdatedMessage {
    return { type: MessageType.Updated, body };
  },

  scriptsAdded(scripts: Script[]): ScriptsAddedMessage {
    return { type: MessageType.ScriptsAdded, scripts };
  },

  stylesheetsAdded(stylesheets: Stylesheet[]): StylesheetsAddedMessage {
    return { type: MessageType.StylesheetsAdded, stylesheets };
  },
};

export function serializeMessage(msg: PageMessage): string {
  return JSON.stringify(msg);
}
