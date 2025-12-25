import mongoose from "mongoose";

const completedTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  taskName: { type: String, required: true },
  file: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedAt: Date,
  },
  submittedAt: { type: Date, default: Date.now },
});

const CompletedTask = mongoose.model("CompletedTask", completedTaskSchema);
export default CompletedTask;
