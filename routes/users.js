const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/manku");

const userSchema = mongoose.Schema({
  username: String,
  age: Number,
  password: String,
  posts: [
    {type: mongoose.Schema.Types.ObjectId, ref: "post"}
  ],
  email: String,
  image: {
    type: String,
    default: "def.png"
  }
})

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);