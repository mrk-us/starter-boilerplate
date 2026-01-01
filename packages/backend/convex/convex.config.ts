import r2 from "@convex-dev/r2/convex.config.js";
import resend from "@convex-dev/resend/convex.config.js";
import workOSAuthKit from "@convex-dev/workos-authkit/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();

app.use(workOSAuthKit);
app.use(resend);
app.use(r2);

export default app;
