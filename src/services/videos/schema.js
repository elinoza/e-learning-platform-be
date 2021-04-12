const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const VideoSchema = new Schema(
  {
    videoName: String,
    videoInfo:String,
    tutor: {
      tutorName: String,
      tutorProfession: String,
      tutorImg:String,
    },
    duration: Number,
    playListLength: Number,
    playList: [{ 
        src: String, 
        type: {type:String},
        duration: Number, 
        contentName: String }],
    category: String,
    level:String,
    skills: [
      {
        type: String,
      },
    ],
    video_cover_img:String,
    video_thumbnail_img:String,
    myProgress:[{ type: Schema.Types.ObjectId, ref: "progress" }],

    likes: [{ type: Schema.Types.ObjectId, ref: "user"}],

    saved: [{ type: Schema.Types.ObjectId, ref: "user" }],
    posts: [{ type: Schema.Types.ObjectId, ref: "post" }],
    
  },

  
  { timestamps: true }
);



module.exports = model("Video", VideoSchema);
