import connectDB from "./db/index.js";
import dotenv from "dotenv";


dotenv.config({
    path:'./env' // Ensure the path to your .env file is correct
});

connectDB()