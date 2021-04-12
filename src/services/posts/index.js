const express = require("express");
const mongoose = require("mongoose");
const PostSchema = require("./schema");
const UserSchema = require("../users/schema");
const CommentSchema = require("../comments/schema");
const q2m = require("query-to-mongo");

const { authenticate } = require("../auth/tools");
const { authorize } = require("../auth/middleware");

const postRouter = express.Router();

///comments
//Get comment related post
postRouter.get("/:postId/comments", authorize, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;
    const post = await PostSchema.findById(postId);
    if (post) {
      const comments = await CommentSchema.find({
        post: postId,
      }).populate("user");

      if (comments.length > 0) {
        console.log("comments",comments);
        res.send(comments);
      } else {
        const error = new Error(` there is no comments with this postId`);
        error.httpStatusCode = 404;
        next(error);
      }
    }
    else{ const error = new Error(` there is no post with this postId`);
    error.httpStatusCode = 404;
    next(error);

    }
  } catch (error) {
    return next(error);
  }
});

// post a comment related to post
postRouter.post("/:postId/comments", authorize, async (req, res, next) => {
  try {
    //kursa ait post oluştur.user ve video schemalarına da kayıt at

    const id = req.params.postId;

    const post = await PostSchema.findById(id);

    if (post) {
      console.log("hey new post is saved --> requestbody", req.body);

      const newComment = new CommentSchema({
        ...req.body,
        post: req.params.postId,
        user: req.user._id,
      });

      console.log("hello before saving");
      //AŞağıda oluşturulan yeni progree kaydının idsi mevcut
      const { _id } = await newComment.save();
      console.log("hello after saving");
      console.log(
        "hey new postis saved here --> requestbody,newComment,postid",
        req.body,
        newComment,
        _id
      );
      ///User Schemaya da  post kaydı atıyoruz ki daha sonra get /me ile ulaşabilelim
      await UserSchema.findByIdAndUpdate(
        req.user._id,
        {
          $addToSet: {
            comments: _id,
          },
        },
        { runValidators: true, new: true }
      );
      ///PostSchemaya da  post kaydı atıyoruz ki daha sonra get /posts ile ulaşabilelim
      await PostSchema.findByIdAndUpdate(
        req.params.postId,
        {
          $addToSet: {
            comments: _id,
          },
        },
        { runValidators: true, new: true }
      );

      res.send(newComment);
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

postRouter.delete(
  "/:postId/comments/:commentId",
  authorize,
  async (req, res, next) => {
    try {
      // DELETE FROM comments SCHEMA
      const comment = await CommentSchema.findByIdAndDelete(
        req.params.commentId
      );

      // DELETE FROM USER & POST SCHEMA
      await UserSchema.findByIdAndUpdate(
        req.user._id,
        {
          $pull: {
            comments: { _id: mongoose.Types.ObjectId(req.params.commentId) },
          },
        },
        {
          new: true,
        }
      );
      await PostSchema.findByIdAndUpdate(
        req.params.postId,
        {
          $pull: {
            comments: { _id: mongoose.Types.ObjectId(req.params.postId) },
          },
        },
        {
          new: true,
        }
      );

      if (comment) {
        res.send("comment deleted");
      } else {
        const error = new Error(`comment is not found`);
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

postRouter.put(
  "/:postId/comments/:commentId",
  authorize,
  async (req, res, next) => {
    try {
      const modifiedPost = await CommentSchema.findByIdAndUpdate(
        req.params.commentId,
        { ...req.body, post: req.params.postId, user: req.user._id },
        {
          runValidators: true,
          new: true,
        }
      );

      if (modifiedPost) {
        res.send(modifiedPost);
      } else {
        const error = new Error(`comment is not found`);
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);


postRouter.post("/like/:postId", authorize, async (req, res, next) => {
    try {
      const Post = await PostSchema.findByIdAndUpdate(
        req.params.postId,
        {
          $addToSet: {
           likes: req.user._id,
          },
        },
        {
          runValidators: true,
          new: true,
        }
      );
      if (Post) {
        const updated = await UserSchema.findByIdAndUpdate(
          req.user,
          {
            $addToSet: {
             likedPosts: req.params.postId,
            },
          },
          { runValidators: true, new: true }
        );
        res.status(201).send("saved");
      } else {
        const error = new Error(
          `Post with id ${req.params.postId} not found`
        );
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      next(error);
    }
  });
  
  postRouter.post("/unlike/:postId", authorize, async (req, res, next) => {
    try {
      const post = await PostSchema.findByIdAndUpdate(
        req.params.postId,
        {
          $pull: {
           likes: req.user._id,
          },
        },
        {
          runValidators: true,
          new: true,
        }
      );
      if (post) {
        const updated = await UserSchema.findByIdAndUpdate(
          req.user,
          {
            $pull: {
              likedPosts: req.params.postId,
            },
          },
          { runValidators: true, new: true }
        );
        res.status(201).send("removed the like")
      } else {
        const error = new Error(
          `post with id ${req.params.postId} not found`
        );
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      next(error);
    }
  });

module.exports = postRouter;
