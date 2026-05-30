import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      index: true,
    },
    topics: [{ type: String, lowercase: true, index: true }],
    statement: { type: String, required: true },
    examples: [{ input: String, output: String, explanation: String }],
    constraints: [String],
    hints: [String],
    source: { type: String },
  },
  { timestamps: true }
);

questionSchema.index({ title: "text", statement: "text" });

questionSchema.methods.toJSON = function () {
  return {
    id: this._id.toString(),
    slug: this.slug,
    title: this.title,
    difficulty: this.difficulty,
    topics: this.topics,
    statement: this.statement,
    examples: this.examples,
    constraints: this.constraints,
    hints: this.hints,
    source: this.source,
  };
};

export default mongoose.model("Question", questionSchema);
