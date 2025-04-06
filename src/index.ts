import { Hono } from "hono";

import { router as embedRouter } from "./routes/embed";

const app = new Hono<Env>();

app.route("/embed", embedRouter);

app.notFound((c) => {
  return c.text("not Found", 404);
});

export default app;
