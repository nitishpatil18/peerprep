import mongoose from "mongoose";

const skillRatingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    rating: { type: Number, default: 1000 },
    gamesPlayed: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

skillRatingSchema.index({ user: 1, topic: 1 }, { unique: true });

skillRatingSchema.methods.toJSON = function () {
  return {
    id: this._id.toString(),
    user: this.user.toString(),
    topic: this.topic,
    rating: Math.round(this.rating),
    gamesPlayed: this.gamesPlayed,
    lastUpdated: this.lastUpdated,
  };
};

export default mongoose.model("SkillRating", skillRatingSchema);
