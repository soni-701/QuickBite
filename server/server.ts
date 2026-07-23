import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import dns from 'node:dns';
import authRouter from "./routes/authRoutes.js";
import restaurantRouter from "./routes/restaurantroutes.js";

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8','8.8.4.4']);

const app = express();

//connect Mongodb
await connectDB()

// Middleware
app.use(cors())
app.use(express.json());
//port
const port = process.env.PORT || 6000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use("/api/auth",authRouter)
app.use("/api/restaurants",restaurantRouter);

//global error handler 

app.use((err:Error,req:Request,res:Response,next:NextFunction)=>{
    console.error("Unhandle Error",err);
    res.status(500).json({
        message:err.message || "Internal server error",
        stack:process.env.NODE_ENV==="production" ? undefined : err.stack,
    });
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});