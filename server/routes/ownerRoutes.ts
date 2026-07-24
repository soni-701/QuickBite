import { Router } from "express";
import { createOwnerRestaurant, getownerBookings, getOwnerRestaurant, updateBookingStatus, updateownerRestaurant } from "../controllers/ownerController.js";
import upload from "../config/multer.js";
import { ownerOnly, protect } from "../middlewares/auth.js";


const ownerRouter=Router();

ownerRouter.use(protect);
ownerRouter.use(ownerOnly);

ownerRouter.get("/restaurant",getOwnerRestaurant);
ownerRouter.post("/restaurant",upload.single("image"),createOwnerRestaurant);
ownerRouter.put("/restaurant",upload.single("image"),updateownerRestaurant);
ownerRouter.get("/bookings",getownerBookings);
ownerRouter.put("/bookings/:id/status",updateBookingStatus);

export default ownerRouter;