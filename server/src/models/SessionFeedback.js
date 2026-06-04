import mongoose from "mongoose";

const sessionFeedbackSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ratee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    peerRating: { type: Number, min: 1, max: 5, required: true },
    difficultyRating: {
      type: String,
      enum: ["too_easy", "right", "too_hard"],
      required: true,
    },
    questionSlug: { type: String, default: null },
    notes: { type: String, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

sessionFeedbackSchema.index({ session: 1, rater: 1 }, { unique: true });

sessionFeedbackSchema.methods.toJSON = function () {
  return {
    id: this._id.toString(),
    session: this.session.toString(),
    rater: this.rater.toString(),
    ratee: this.ratee.toString(),
    peerRating: this.peerRating,
    difficultyRating: this.difficultyRating,
    questionSlug: this.questionSlug,
    notes: this.notes,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("SessionFeedback", sessionFeedbackSchema);
