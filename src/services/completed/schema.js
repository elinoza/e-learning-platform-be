const { Schema, model } = require("mongoose")

const completedSchema = new Schema(
  {
  index: { type: Number }
    
   
  },
  {
    timestamps: true,
  }
)

module.exports = model("completed", completedSchema)