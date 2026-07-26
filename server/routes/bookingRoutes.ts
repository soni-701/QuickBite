import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import { CancelBooking, createBooking, getMyBookings } from "../controllers/bookingController.js";


const bookingRouter=Router();


bookingRouter.post("/",protect,createBooking);
bookingRouter.get("/my",protect,getMyBookings);
bookingRouter.patch("/:id/cancel",protect,CancelBooking);

export default bookingRouter;