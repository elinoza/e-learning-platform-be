const { Schema, model } = require("mongoose")

const SkillSchema = new Schema(
    { 
      
        skillName:{type:String},
        category:{type:String}
       },
 
  {
    timestamps: true,
  }
)

module.exports = model("skill", SkillSchema)