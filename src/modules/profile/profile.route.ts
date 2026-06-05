import { Router } from "express";
import { profileController } from "./profile.controller";

const router = Router();

// router.get("/", profileController.getAllUsers);
// router.get("/:id", profileController.getSingleUser);
router.post("/", profileController.createProfile);
// router.put("/:id", profileController.updateUser);
// router.delete("/:id", profileController.deleteUser);

export const profileRoute = router;
