import { Request, Response } from "express";
import { Restaurant } from "../models/Restaurant.js";
import  jwt  from "jsonwebtoken";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";
import {time} from "node:console";
//get all restaurants with search and filters
//get/api/restaurants 
export const getRestaurants = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, priceRange, rating, location, sort } = req.query;

        //Build queryObj
        const queryObj: any = { status: "approved" };
        if (search) {
            queryObj.$or = [
                { name: { rgex: search, $options: "i" } },
                { tags: { rgex: search, $options: "i" } },
                { location: { rgex: search, $options: "i" } }
            ]
        }

        if (priceRange) {
            const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
            queryObj.priceRange = { $in: prices };
        }

        if (rating) {
            queryObj.rating = { $gte: parseFloat(rating as string) };
        }

        if (location) {
            queryObj.location = { $regex: location as string, $options: "i" };
        }

        //sorting

        let sortOption: any = { createdAt: -1 }
        if (sort === "rating") {
            sortOption = { rating: -1 }
        }
        else if (sort === "price_low") {
            sortOption = { priceRange: 1 };
        }
        else if (sort === "price_high") {
            sortOption = { priceRange: -1 }
        }

        const restaurant = await Restaurant.find(queryObj).sort(sortOption);
        res.json(restaurant)

    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}


//get featured and exclusive resturants
//get /api/restaurants/featured
export const getFeaturedRestaurants = async (req: Request, res: Response): Promise<void> => {
    try {

        const featured = await Restaurant.find({
            status: "approved",
            $or: [{ featured: true }, { exclusive: true }]
        }).limit(6)
        res.json(featured);


    } catch (error: any) {
        console.error("Get featured Restaurant Error", error);
        res.status(400).json({ message: "Server Error" });
    }
}


//get single resturant by slug
//get /api/restaurants/:slug
export const getRestaurantBySlug = async (req: Request, res: Response): Promise<void> => {
    try {

        const restaurant = await Restaurant.findOne({ slug: req.params.slug })

        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }

        //if not approved verify authorisation (owner or admin)
        if (restaurant.status !== "approved") {
            let isAuthorised = false;
            if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
                try {
                const token = req.headers.authorization.split(" ")[1];
                    const decoded = jwt.verify(
                        token,
                        process.env.JWT_SECRET as string
                    ) as { id: string };

                const user=await User.findById(decoded.id);
                if(user && (user.role==="admin" || (user.role==="owner" && restaurant.owner.toString()===user._id.toString()))){
                    isAuthorised=true;
                }
                } catch (error) {
                        //ignore token verify error

                }
            }
           if (!isAuthorised) {
            res.status(404).json({ message: "Restaurant not found or pending approval" });
            return;
        }

        }
        res.json(restaurant);

    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}

//get dynamic seat for availability
//get /api/restaurants/:id/availability
export const getRestaurantAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const {date}=req.query;
        if(!date){
            res.status(404).json({message:"Please provide a date"})  
            return;      
        }

        const restaurant=await Restaurant.findById(req.params.id);
         if(!restaurant){
            res.status(404).json({message:"Restaurant not found"})  
            return;      
        }

        const bookingDate=new Date(date as string);

        //get all active bookings on this date for restaurant

        const bookings=await Booking.find({
            restaurant:restaurant._id,
            date:bookingDate,
            status:"confirmed",
        })

        ////map slots to available capacities
        const availability=restaurant.availableSlots.map((slot)=>{
            const bookedSeats=bookings.filter((b)=>b.time=== slot).reduce((sum,b)=>sum+b.guests,0)

            const totalSeats=restaurant.totalSeats||20;
            const availableSeats=Math.max(0,totalSeats-bookedSeats);

            return {
                time:slot,
                availableSeats,
                isAvailable:availableSeats >0
            }
        })
            res.json(availability)

    } 
    catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}