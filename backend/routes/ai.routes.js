import express from "express";
import { getAIAdvice } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/ask", getAIAdvice);

export default router;
