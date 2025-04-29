import pino from "pino";
import { multistream } from "pino";
import { env } from "./env.js";

const streams = [
  { level: "info", stream: pino.destination(1) },
  { level: "error", stream: pino.destination(2) },
];

const logger = pino(
  {
    level: env.NODE_ENV === "production" ? "error" : "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  },
  multistream(streams),
);

export default logger;
