import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    matchScore: { type: Number },
    matchReasons: { type: Object },
    startedAt: { type: Date },
    endedAt: { type: Date },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    finalCode: { type: String, default: "" },
    finalLanguage: { type: String, default: "python" },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sessionSchema.methods.toJSON = function () {
  return {
    id: this._id.toString(),
    participants: this.participants.map((p) => p.toString()),
    status: this.status,
    matchScore: this.matchScore,
    matchReasons: this.matchReasons,
    startedAt: this.startedAt,
    endedAt: this.endedAt,
    endedBy: this.endedBy?.toString(),
    finalCode: this.finalCode,
    finalLanguage: this.finalLanguage,
    durationSeconds: this.durationSeconds,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("Session", sessionSchema);
