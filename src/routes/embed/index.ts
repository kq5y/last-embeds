import { Hono } from "hono";

import { handler as tracksHandler } from "./tracks";

const router = new Hono<Env>();

router.get("/tracks", tracksHandler);

export { router };
