const mongoose = require("mongoose");

const connect = () => {
  return mongoose.connect(
    "mongodb+srv://girisha:8762331996@cluster0.51hylkq.mongodb.net/swiggy?retryWrites=true&w=majority"
  );
};
module.exports = connect;
