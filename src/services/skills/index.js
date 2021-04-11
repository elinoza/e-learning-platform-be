const express = require("express");
const mongoose = require("mongoose")
const SkillSchema = require("./schema");

const q2m = require("query-to-mongo")

const { authenticate } = require("../auth/tools");
const { authorize } = require("../auth/middleware");

const skillRouter = express.Router();

skillRouter.post("/", authorize, async (req, res, next) => {
  try {
    console.log("NEW SKILL");
    const skill = { ...req.body};
    console.log(skill);

    const newskill = new SkillSchema(skill);
    const { _id } = await newskill.save();

    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});
skillRouter.get("/", authorize, async (req, res, next) => {
  try {
console.log(req.query)
    const skills = await SkillSchema.find(req.query)
    .populate("myProgress")
    .populate("saved");
    // console.log(skills)
    // skills.map((skill) =>  console.log(skill))
    res.send(skills);
  } catch (error) {
    console.log(error);
  }
});

skillRouter.get("/:courseId", authorize, async (req, res, next) => {
  try {
    const id = req.params.courseId;

    const skill = await SkillSchema.findById(id)
    .populate("myProgress")
    .populate("saved");;
    if (skill) {
      res.send(skill);
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

skillRouter.put("/:courseId", authorize, async (req, res, next) => {
  try {
    const skill = await SkillSchema.findByIdAndUpdate(
      req.params.courseId,
      req.body,
      {
        runValidators: true,
        new: true,
      }
    );
    if (skill) {
      res.send(skill);
    } else {
      const error = new Error(`skill with id ${req.params.courseId} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

skillRouter.delete("/:courseId", authorize, async (req, res, next) => {
  try {
    const skill = await SkillSchema.findByIdAndDelete(req.params.courseId);
    if (skill) {
      res.send("Deleted");
    } else {
      const error = new Error(`skill with id ${req.params.courseId} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});
