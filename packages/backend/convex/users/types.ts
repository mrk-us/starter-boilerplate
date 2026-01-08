import type { z } from "zod";
import type { userSchema } from "./validation";

export type User = z.infer<typeof userSchema>;
