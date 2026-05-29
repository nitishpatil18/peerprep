import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set in .env");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("mongodb connected");
  } catch (err) {
    console.error("mongodb connection failed:", err.message);
    process.exit(1);
  }
}
