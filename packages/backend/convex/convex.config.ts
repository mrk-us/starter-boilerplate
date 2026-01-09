import polar from "@convex-dev/polar/convex.config.js";
import r2 from "@convex-dev/r2/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import resend from "@convex-dev/resend/convex.config.js";
import workOSAuthKit from "@convex-dev/workos-authkit/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();

app.use(workOSAuthKit);
app.use(resend);
app.use(r2);
app.use(rateLimiter);
app.use(polar);

export default app;
