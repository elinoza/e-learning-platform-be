const { Schema, model } = require("mongoose")

const SkillSchema = new Schema(
    { 
      
        skillName:String
       },
 
  {
    timestamps: true,
  }
)

module.exports = model("Skill", SkillSchema)