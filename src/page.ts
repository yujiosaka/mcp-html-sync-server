import type { WebSocket } from "ws";

export type Script =
  | { src: string; content?: never }
  | { src?: never; content: string };

export type Stylesheet = { href: string };

export interface Page {
  id: string;
  body: string;
  scripts: Script[];
  stylesheets: Stylesheet[];
  createdAt: Date;
  expiresAt: Date;
  connections: Set<WebSocket>;
}
