/**
 * Created by miyani on 3/27/18.
 */
"use strict";
let signalAPI = require("../API/SignalAPI");

//todo change variable  name
let Proj_dir = "/var/www/nodejs-signal.app";
//todo change db   name
let DB_collecation = "signal";
let app = require("express")();
let mongoURL = "mongodb://localhost:27017";
let fs = require("fs");
let https = require("https");
let moment = require("moment");
let MongoDb = {};
let bodyParser = require("body-parser");
const CronJob = require("cron").CronJob;
const cors = require('cors');

app.use(bodyParser.json());
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
let credentials = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};
// let io = require("socket.io")(https.createServer(credentials, app).listen(2054));
//todo Change port here
let io = require("socket.io")(require("http").createServer(app).listen(2054));
function CurrentTimeStamp() {
  return new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
}

DbConnect();

function DbConnect() {
  //this is source code for connection
  let MongoClient = require("mongodb").MongoClient;
  MongoClient.connect(
    mongoURL,
    {
      // auto_reconnect: true,
      //  useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    function (err, dbconnection) {
      if (err) throw err;
      console.log("mongoDb connected!!");

      var collection = dbconnection.db(DB_collecation);
      MongoDb.friend = collection.collection("friend");
      MongoDb.user = collection.collection("user");
      var subscriptionJob = new CronJob("0 0 0 * * *", async function () {
        var users = await MongoDb.user.find({ subscription: 0 }).toArray();

        for (let i = 0; i < users.length; i++) {
          const user = users[i];

          var now = moment(new Date().toISOString());
          var end = moment(user.createdAt);
          if (moment.duration(now.diff(end)).asDays() >= 10) {
            await MongoDb.user.deleteOne({ _id: user._id });
          }
        }
      });
      subscriptionJob.start();
      var freeTimeJob = new CronJob("*/1 * * * *", async function () {
        var users = await MongoDb.user.find({ subscription: 0 }).toArray();

        for (let i = 0; i < users.length; i++) {
          const user = users[i];

          var now = moment(new Date().toISOString());
          var end = moment(user.createdAt);

          var instaUsedTime = moment(user.instaUsedTime ?? user.createdAt);

          console.log("CreatedAt: " + end)
          console.log("Insta Time: " + instaUsedTime)
          if (moment.duration(now.diff(end)).asHours() >= 6  && moment.duration(now.diff(instaUsedTime)).asHours() >= 6) {
            await MongoDb.user.updateOne({ _id: user._id }, {$set: {freetime: 0}});
          }
        }
      });
      freeTimeJob.start();

  
      dbconnection.on("close", function () {
        console.log("Close + ");
      });
      dbconnection.on("connected", function () {
        console.log("connected");
      });
    }
  );
}

var _this = (module.exports = {
  MongoDb,
  fs,
  io,
  app,
  Proj_dir,
  CurrentTimeStamp,
});
/*Load route*/
signalAPI.Payment(_this);
