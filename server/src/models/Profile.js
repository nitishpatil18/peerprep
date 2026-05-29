import mongoose from "mongoose";

const availabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startMinute: { type: Number, min: 0, max: 1439, required: true },
    endMinute: { type: Number, min: 1, max: 1440, required: true },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    targetRole: {
      type: String,
      enum: ["sde", "mle", "ds", "frontend", "backend", "fullstack", "other"],
      default: "sde",
    },
    experienceLevel: {
      type: String,
      enum: ["student", "intern", "junior", "mid", "senior"],
      default: "student",
    },
    skills: [{ type: String, trim: true, lowercase: true }],
    topics: [{ type: String, trim: true, lowercase: true }],
    preferredLanguages: [{ type: String, trim: true, lowercase: true }],
    timezone: { type: String, default: "Asia/Kolkata" },
    bio: { type: String, maxlength: 500, default: "" },
    availability: [availabilitySlotSchema],
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

profileSchema.methods.toJSON = function () {
  return {
    id: this._id.toString(),
    user: this.user.toString(),
    targetRole: this.targetRole,
    experienceLevel: this.experienceLevel,
    skills: this.skills,
    topics: this.topics,
    preferredLanguages: this.preferredLanguages,
    timezone: this.timezone,
    bio: this.bio,
    availability: this.availability,
    isComplete: this.isComplete,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model("Profile", profileSchema);
