import {NextFunction, Request,Response} from "express";
import { IUser, User } from "../models/User.js";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request{
    user?:IUser;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            message: "Not authorised, no token"
        });
        return;
    }

    try {
        const token = authHeader.split(" ")[1];

        console.log("AUTH HEADER:", authHeader);
        console.log("TOKEN RECEIVED:", token);

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as { id: string };

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            res.status(401).json({
                message: "Not authorised, user not found"
            });
            return;
        }

        req.user = user;

        // IMPORTANT
        return next();

    } catch (error) {
        console.error("Auth middleware Error:", error);

        if (!res.headersSent) {
            res.status(401).json({
                message: "Not authorised, token failed"
            });
        }

        return;
    }
};

export const adminOnly=(req:AuthRequest,res:Response,next:NextFunction):void=>{
    if(req.user && req.user.role==="admin"){
        next();
    }
    else{
        res.status(403).json({message:"Access denied ,admin role required"});
    }
}

export const ownerOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {

    console.log("CURRENT USER:", req.user);
    console.log("CURRENT USER ROLE:", req.user?.role);

    if (
        req.user &&
        (req.user.role === "owner" || req.user.role === "admin")
    ) {
        next();
        return;
    }

    res.status(403).json({
        message: `Access denied. Current role: ${req.user?.role}`
    });
};