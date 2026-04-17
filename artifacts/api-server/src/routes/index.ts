import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nibrasRouter from "./nibras";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nibrasRouter);

export default router;
