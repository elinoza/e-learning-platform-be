const express = require("express");
const mongoose = require("mongoose")
const VideoSchema = require("./schema");
const UserSchema = require("../users/schema");
const playlistSchema = require("../playlist/schema");
const PostSchema = require("../posts/schema");
const CommentSchema = require("../comments/schema");
const q2m = require("query-to-mongo")

const { authenticate } = require("../auth/tools");
const { authorize } = require("../auth/middleware");

const videoRouter = express.Router();

videoRouter.post("/", authorize, async (req, res, next) => {
  try {
    console.log("NEW VIDEO");
    const video = { ...req.body,duration:0 };
    console.log(video);

    const newvideo = new VideoSchema(video);
    const { _id } = await newvideo.save();

    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});
videoRouter.get("/", authorize, async (req, res, next) => {
  try {
console.log(req.query)
    const videos = await VideoSchema.find(req.query)
    .populate("myProgress")
    .populate("saved");
    // console.log(videos)
    // videos.map((video) =>  console.log(video))
    res.send(videos);
  } catch (error) {
    console.log(error);
  }
});

videoRouter.get("/:courseId", authorize, async (req, res, next) => {
  try {
    const id = req.params.courseId;

    const video = await VideoSchema.findById(id)
    .populate("myProgress")
    .populate("saved");;
    if (video) {
      res.send(video);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next("PROBLEM OCCURED");
  }
});

videoRouter.put("/:courseId", authorize, async (req, res, next) => {
  try {
    const video = await VideoSchema.findByIdAndUpdate(
      req.params.courseId,
      req.body,
      {
        runValidators: true,
        new: true,
      }
    );
    if (video) {
      res.send(video);
    } else {
      const error = new Error(`video with id ${req.params.courseId} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

videoRouter.delete("/:courseId", authorize, async (req, res, next) => {
  try {
    const video = await VideoSchema.findByIdAndDelete(req.params.courseId);
    if (video) {
      res.send("Deleted");
    } else {
      const error = new Error(`video with id ${req.params.courseId} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

///EMBEDDING playlist

videoRouter.post(
  "/:courseId/addplaylist",
  authorize,
  async (req, res, next) => {
    try {
      const playlist = new playlistSchema(req.body);

      const playlistToInsert = { ...playlist.toObject() };
      console.log(playlist, playlistToInsert);


      const updated = await VideoSchema.findByIdAndUpdate(
        req.params.courseId,
        {
          $push: {
            playList: playlistToInsert,
          },
        },
        { runValidators: true, new: true }
      );
      


      let duration= updated.duration 
      let newduration= updated.duration+req.body.duration
    
      console.log("duration,newduration",duration,newduration)
      
      const video = await VideoSchema.findByIdAndUpdate(
        req.params.courseId,
       {duration:newduration},
        {
          runValidators: true,
          new: true,
        }
      );

      res.status(201).send(updated);
    } catch (error) {
      next(error);
    }
  }
);

videoRouter.get("/:courseId/playlist", authorize, async (req, res, next) => {
  try {
    const playlist  = await VideoSchema.findById(req.params.courseId, {
      playList: 1,
      _id: 0,
    });

    console.log(playlist)
    res.send(playlist);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

videoRouter.get(
  "/:courseId/playlist/:videoId",
  authorize,
  async (req, res, next) => {
    try {
      const  playlist  = await VideoSchema.find(
        {
          _id: mongoose.Types.ObjectId(req.params.courseId),
        },
        {_id: 0,
         
          
          playList: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.params.videoId) },
          },
        }
      );

      if (playlist && playlist.length > 0) {
        res.send(playlist[0].playList[0]);
      } else {
        const error = new Error(
          `course with id ${req.params.courseId} or video with ID:${req.params.videoId}  not found`
        );
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

videoRouter.delete(
  "/:courseId/playlist/:videoId",
  authorize,
  async (req, res, next) => {
    try {
      const modifiedreview = await VideoSchema.findByIdAndUpdate(
        req.params.courseId,
        {
          $pull: {
            playList: { _id: mongoose.Types.ObjectId(req.params.videoId) },
          },
        },
        {
          new: true,
        }
      );
      res.send(modifiedreview);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

videoRouter.put(
  "/:courseId/playlist/:videoId",
  authorize,
  async (req, res, next) => {
    try {
      const { playlist } = await VideoSchema.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.courseId),
        },
        {
          _id: 0,
          playList: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.params.videoId) },
          },
        }
      );
console.log({ playlist })
      if (playlist && playlist.length > 0) {
        const reviewToReplace = { ...playlist[0].toObject(), ...req.body };

        const modifiedreview = await VideoSchema.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.courseId),
            "playList._id": mongoose.Types.ObjectId(req.params.videoId),
          },
          { $set: { "playList.$": reviewToReplace } },
          {
            runValidators: true,
            new: true,
          }
        );
        res.send(modifiedreview);
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

///SAVE A VIDEO


videoRouter.get("/saved/:courseId", authorize, async (req, res, next) => {
  try {
    const Course = await VideoSchema.findById(req.params.courseId, {
      _id: 0,
      saved: 1,
    }).populate("saved");
    if (Course) {
      res.send(Course);
    } else {
      const error = new Error(
        `Course with id ${req.params.courseId} not found`
      );
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    return next(error);
  }
});

videoRouter.put("/:courseId", authorize, async (req, res, next) => {
  try {
    const Course = { ...req.body };
    const author = await VideoSchema.findById(req.params.courseId, {
      _id: 0,
      user: 1,
    });
    if (author.userName !== req.user.userName) {
      const error = new Error(
        `User does not own the Course with id ${req.params.courseId}`
      );
      error.httpStatusCode = 403;
      return next(error);
    }
    const newCourse = await VideoSchema.findByIdAndUpdate(
      req.params.courseId,
      Course,
      {
        runValidators: true,
        new: true,
      }
    );
    if (newCourse) {
      res.status(201).send(req.params.courseId);
    } else {
      const error = new Error(
        `Course with id ${req.params.courseId} not found`
      );
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

videoRouter.post("/save/:courseId", authorize, async (req, res, next) => {
  try {
    const Course = await VideoSchema.findByIdAndUpdate(
      req.params.courseId,
      {
        $addToSet: {
          saved: req.user._id,
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );
    if (Course) {
      const updated = await UserSchema.findByIdAndUpdate(
        req.user,
        {
          $addToSet: {
            savedVideos: req.params.courseId,
          },
        },
        { runValidators: true, new: true }
      );
      res.status(201).send("saved");
    } else {
      const error = new Error(
        `Course with id ${req.params.courseId} not found`
      );
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

videoRouter.post("/unsave/:courseId", authorize, async (req, res, next) => {
  try {
    const Course = await VideoSchema.findByIdAndUpdate(
      req.params.courseId,
      {
        $pull: {
          saved: req.user._id,
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );
    if (Course) {
      const updated = await UserSchema.findByIdAndUpdate(
        req.user,
        {
          $pull: {
            savedVideos: req.params.courseId,
          },
        },
        { runValidators: true, new: true }
      );
      res.status(201).send("removed the save");
    } else {
      const error = new Error(
        `Course with id ${req.params.courseId} not found`
      );
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});



///POSTS 
//Get video related posts
videoRouter.get("/:courseId/posts", authorize, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const courseId = req.params.courseId;
    const posts = await  PostSchema.find(
      {
        
          course: courseId
      }
    )
    .populate('user')
    .populate('comments')

    if (posts.length>0) {
      console.log(posts)
      res.send(posts);
    } else {
      const error = new Error(` there is no post with this courseId`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    return next(error);
  }
});


// post a post related to video
videoRouter.post("/:courseId/posts", authorize, async (req, res, next) => {
  try {

//kursa ait post oluştur.user ve video schemalarına da kayıt at


    const id = req.params.courseId;

    const course = await VideoSchema.findById(id);

    if (course) {
    

console.log("hey new post is saved --> requestbody",req.body)

        
        const newPost= new PostSchema({
          ...req.body,
          course: req.params.courseId,
          user: req.user._id
        });

        console.log("hello before saving")
        //AŞağıda oluşturulan yeni progree kaydının idsi mevcut
        const { _id } = await newPost.save();
        console.log("hello after saving")
        console.log("hey new postis saved here --> requestbody,newPost,postid",req.body,newPost,_id)
        ///User Schemaya da  post kaydı atıyoruz ki daha sonra get /me ile ulaşabilelim
        await UserSchema.findByIdAndUpdate(
          req.user._id,
          {
            $addToSet: {
              posts: _id,
            },
          },
          { runValidators: true, new: true }
        );
         ///Video Schemaya da  post kaydı atıyoruz ki daha sonra get /videos ile ulaşabilelim
          await VideoSchema.findByIdAndUpdate(
          req.params.courseId,
          {
            $addToSet: {
              posts: _id,
            },
          },
          { runValidators: true, new: true }
        );

        res.send(newPost);
    
    } else {
      //bu id ile bir kurs mevcut değil
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

videoRouter.delete(
  "/:courseId/posts/:postId",
  authorize,
  async (req, res, next) => {
    try {

      // DELETE FROM POST SCHEMA
      const post  = await PostSchema.findByIdAndDelete(req.params.postId);

   // DELETE FROM USER & VIDEO SCHEMA
       await UserSchema.findByIdAndUpdate(
        req.user._id,
        {
          $pull: {
            posts: { _id: mongoose.Types.ObjectId(req.params.postId) },
          },
        },
        {
          new: true,
        }
      );
      await VideoSchema.findByIdAndUpdate(
        req.params.courseId,
        {
          $pull: {
            posts: { _id: mongoose.Types.ObjectId(req.params.postId) },
          },
        },
        {
          new: true,
        }
      );

          if(post){ res.send("post deleted");}
          else{const error = new Error(`post is not found`);
          error.httpStatusCode = 404;
          next(error);}
     
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

videoRouter.put(
  "/:courseId/posts/:postId",
  authorize,
  async (req, res, next) => {
    try {
      const modifiedPost = await PostSchema.findByIdAndUpdate(
        req.params.postId,
        {...req.body,course:req.params.courseId,user:req.user._id},
        {
          runValidators: true,
          new: true,
        }
      );






      if(modifiedPost){ res.send(modifiedPost)}
      else{const error = new Error(`post is not found`);
      error.httpStatusCode = 404;
      next(error);}


    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);
  
 


module.exports = videoRouter;
