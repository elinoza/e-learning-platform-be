const { Schema, model } = require("mongoose")
const mongoose = require("mongoose")


const CommentSchema = new Schema(
	{
		text: {
			type: String,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "user",
			required: true,
		},
        post: { type: Schema.Types.ObjectId, ref: "post", required: true},
		likes: [{ type: Schema.Types.ObjectId, ref: "user" }]
		
	},
	{ timestamps: true }
)



module.exports = model("comment", CommentSchema);
