import connectDB from "./db/index.js";
import dotenv from "dotenv";


dotenv.config({
    path:'./env' // Ensure the path to your .env file is correct
});

connectDB()
.then(() => {
    app.listem(process.env.PORT || 8000,()=>{
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    })
})
.catch((err) => {
    console.error("Database connection failed:", err); 
});