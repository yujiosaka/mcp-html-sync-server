export const RequestPath = { GetPage: "/:id" } as const;
export type RequestPath = (typeof RequestPath)[keyof typeof RequestPath];

export const WebsocketPath = { Connection: "/ws/:id" } as const;
export type WebsocketPath = (typeof WebsocketPath)[keyof typeof WebsocketPath];
