    import dotenv from "dotenv";
import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';

dotenv.config({
    path: './.env'
})
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        console.log(`MongoDB connected: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;     