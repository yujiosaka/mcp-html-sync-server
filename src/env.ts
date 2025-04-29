import dotenv from "dotenv";
import ms from "ms";
import { z } from "zod";
import { EnvParseError } from "./error.js";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SERVER_HOST: z.string().default("localhost"),
  SERVER_PORT: z
    .string()
    .default("3000")
    .transform((val) => {
      const port = Number.parseInt(val);
      if (typeof port !== "number" || Number.isNaN(port)) {
        throw new EnvParseError("SERVER_PORT", val);
      }
      return port;
    }),
  BASE_URL: z.string().default("http://localhost:3000/"),
  PAGE_MAX_AGE: z
    .string()
    .default("5m")
    .transform((val) => {
      const maxAge = ms(val as ms.StringValue);
      if (typeof maxAge !== "number") {
        throw new EnvParseError("PAGE_MAX_AGE", val);
      }
      return maxAge;
    }),
  PAGE_MAX_COUNT: z
    .string()
    .default("1000")
    .transform((val) => {
      const maxCount = Number.parseInt(val);
      if (typeof maxCount !== "number" || Number.isNaN(maxCount)) {
        throw new EnvParseError("PAGE_MAX_COUNT", val);
      }
      return maxCount;
    }),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
