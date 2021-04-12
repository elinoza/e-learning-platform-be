const express = require("express");
const mongoose = require("mongoose")
const PostSchema = require("./schema");
const UserSchema = require("../users/Schema");
const CommentSchema = require("../comments/schema");
const q2m = require("query-to-mongo")

const { authenticate } = require("../auth/tools");
const { authorize } = require("../auth/middleware");

const postRouter = express.Router();


///comments 
//Get post related comments
postRouter.get("/:postId/comments", authorize, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;
    const comments = await  CommentSchema.find(
      {
        
          post: postId
      }
    )
    .populate('user')

    if (comments) {
      console.log(typeof comments[0])
      res.send(comments[0]);
    } else {
      const error = new Error(` there is no post with this postId`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    return next(error);
  }
});

// post a post related to post
postRouter.post("/:postId/comments", authorize, async (req, res, next) => {
  try {

//kursa ait post oluştur.user ve video schemalarına da kayıt at


    const id = req.params.postId;

    const post = await PostSchema.findById(id);

    if (post) {
    

console.log("hey new post is saved --> requestbody",req.body)

        
        const newComment= new CommentSchema({
          ...req.body,
          post: req.params.postId,
          user: req.user._id
        });

        console.log("hello before saving")
        //AŞağıda oluşturulan yeni progree kaydının idsi mevcut
        const { _id } = await newComment.save();
        console.log("hello after saving")
        console.log("hey new postis saved here --> requestbody,newComment,postid",req.body,newComment,_id)
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

  
 


module.exports = postRouter;
