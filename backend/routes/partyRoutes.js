import express from "express";
const router = express.Router();
import { 
    getAllParties, 
    createParty, 
    getPartyById, 
    updateParty, 
    deleteParty 
} from "../controllers/partyController.js";
import { protect } from "../middlewares/authMiddleware.js";

// 📝 Frontend compatibility ke liye '/list' aur '/' dono set karein
router.route("/")
    .get(protect, getAllParties)
    .post(protect, createParty);

// 🚨 YEH LINE ADD KAREIN: SalesEntry isi ko call kar raha hai
router.get("/list", protect, getAllParties);

router.route("/:id")
    .get(protect, getPartyById)
    .put(protect, updateParty)
    .delete(protect, deleteParty);

export default router;