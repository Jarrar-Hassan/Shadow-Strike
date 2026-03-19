import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import analyzeRouter from "./analyze.js";
import reportsRouter from "./reports.js";
import adminRouter from "./admin.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(analyzeRouter);
router.use(reportsRouter);
router.use(adminRouter);
router.use(statsRouter);

export default router;
