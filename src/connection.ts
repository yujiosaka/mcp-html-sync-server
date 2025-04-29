export const ConnectionCloseCode = {
  Removed: 4000,
  Expired: 4001,
  NotFound: 4002,
} as const;
export type ConnectionCloseCode =
  (typeof ConnectionCloseCode)[keyof typeof ConnectionCloseCode];

export const ConnectionCloseReason = {
  Removed: "Page has been removed",
  Expired: "Page has expired",
  NotFound: "Page not found",
} as const;
export type ConnectionCloseReason =
  (typeof ConnectionCloseReason)[keyof typeof ConnectionCloseReason];
