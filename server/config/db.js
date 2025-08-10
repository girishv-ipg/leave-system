const mongoose = require("mongoose");
//"mongodb://localhost:27017/leaveSystem"
const connect = () => {
  return mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = connect;
