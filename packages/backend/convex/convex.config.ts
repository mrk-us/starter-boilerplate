import polar from "@convex-dev/polar/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import resend from "@convex-dev/resend/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();

app.use(resend);
app.use(rateLimiter);
app.use(polar);

export default app;
