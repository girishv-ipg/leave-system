const mongoose = require("mongoose");
//"mongodb://localhost:27017/leaveSystem"

const MONGO_URL =
  // process.env.MONGO_URL || "mongodb://localhost:27017/leaveSystem";
  "mongodb://root:password@127.0.0.1:17017/leaveSystem?authSource=admin&directConnection=true";

const connect = () => {
  return mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = connect;
