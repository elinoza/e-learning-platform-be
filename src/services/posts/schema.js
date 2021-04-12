const { Schema, model } = require("mongoose");

const PostSchema = new Schema(
  {
    text: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    course: { type: Schema.Types.ObjectId, ref: "Video", required: true, },
    likes: [{ type: Schema.Types.ObjectId, ref: "user" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "comment" }]
  },
  {
    timestamps: true,
  }
);

module.exports = model("post", PostSchema);
