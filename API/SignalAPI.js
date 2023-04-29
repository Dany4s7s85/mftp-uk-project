"use strict";
let ConstantMethod = require("../Utils/ConstantMethod");
const jwt = require("jsonwebtoken");
var admin = require("firebase-admin");
var serviceAccount = require("../vibra-da567-firebase-adminsdk-dbwwb-edf60a7500.json");
const runPy = require("../Utils/runPy.js");
var secret =
  "0f0197693cff040dd33ea81fb9ca7d8b1553f9bf299e088a300c52a5b672a5754d5f4292766a236a1e05462f5e8a51c347dc36763fde6c524c71242bd5dd88c4";

async function generateAccessToken(userData) {
  return await jwt.sign(userData, secret, { expiresIn: "365d" });
}

async function verifyAuthToken(token) {
  var data = await jwt.verify(token, secret);
  return data;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
/* Use a function for the exact format desired... */
function ISODateString(d) {
  function pad(n) {
    return n < 10 ? "0" + n : n;
  }
  return (
    d.getUTCFullYear() +
    "-" +
    pad(d.getUTCMonth() + 1) +
    "-" +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    ":" +
    pad(d.getUTCMinutes()) +
    ":" +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

var _this = (module.exports = {
  Payment: function (constant) {
    constant.app.post("/signal", async function (request, response) {
      //    response.header('Access-Control-Allow-Origin', 'http://localhost:8080/#/');
      response.header("Content-Type", "application/json");
      let Data = request.body;
      if (Data.length > 1e6) {
        // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
        response.end(
          ConstantMethod.Error("FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST.")
        );
        request.connection.destroy();
      } else if (
        Data.eventName != "login" &&
        Data.eventName != "userRegistration" &&
        Data.token == null &&
        Data.eventName != "userSubscription" &&
        Data.eventName != "search" &&
        Data.eventName != "updateUser"
      ) {
        response.end(
          ConstantMethod.Error("You need to send the authorization token")
        );

        return;
      } else {
        var userData =
          Data.token == null ? "" : await verifyAuthToken(Data.token);
        switch (Data.eventName) {
          case "userRegistration":
            delete Data["eventName"];
            constant.MongoDb.user.findOne(
              { userName: Data.userName },
              function (err, res) {
                console.log(res);
                if (!err && res == null) {
                  Data.freetime = 1;
                  Data.subscription = 0;
                  Data.firebaseToken = "";
                  Data.instagramUser = "";
                  Data.createdAt = ISODateString(new Date());
                  constant.MongoDb.user.updateOne(
                    { _id: Data.deviceID },
                    { $set: Data },
                    { upsert: true },
                    function (err, result) {
                      response.end(ConstantMethod.sucessWithCode(1)); //JSON.stringify("User register."),
                    }
                  );
                } else {
                  response.end(ConstantMethod.sucessWithCode(7)); //JSON.stringify("Username is already existed!!"),
                }
              }
            );
            break;

          case "login":
            delete Data["eventName"];
            constant.MongoDb.user.findOne(
              { deviceID: Data.deviceID },
              async function (err, res) {
                console.log(res);
                if (res != null) {
                  var token = await generateAccessToken({
                    deviceID: Data.deviceID,
                  });
                  res.token = token;
                  response.end(JSON.stringify(res));
                } else {
                  response.end(JSON.stringify({ code: 200, status: 1 }));
                }
              }
            );
            break;
          case "search":
            delete Data["eventName"];
            var res = await constant.MongoDb.user
              .find({ userName: { $regex: Data["query"], $options: "i" } })
              .toArray();

            console.log(res);

            response.end(JSON.stringify(res));
            break;
          case "updateUser":
            delete Data["eventName"];
            await constant.MongoDb.user.updateOne(
              { _id: Data.user.deviceID },
              { $set: Data.user }
            );

            var res = await constant.MongoDb.user
              .find({ userName: { $regex: Data["query"], $options: "i" } })
              .toArray();
            console.log(res);

            response.end(JSON.stringify(res));
            break;
          case "updateToken":
            delete Data["eventName"];

            constant.MongoDb.user.findOne(
              { _id: userData.deviceID },
              async function (err, res) {
                if (err || res == null) {
                  response.end(ConstantMethod.Invalid());
                  return;
                }
                await constant.MongoDb.user.updateOne(
                  { _id: res.deviceID },
                  { $set: { firebaseToken: Data.firebaseToken } }
                );

                response.end(
                  ConstantMethod.sucess(
                    JSON.stringify({
                      message: "firebase token changed successfully!",
                    }),
                    200
                  )
                );
              }
            );
            break;
          case "addInstagram":
            delete Data["eventName"];
            var followers = await runPy.runBash();
            console.log(followers);
            constant.MongoDb.user.findOne(
              { _id: userData.deviceID },
              async function (err, res) {
                if (err || res == null) {
                  response.end(ConstantMethod.Invalid());
                  return;
                }
                await constant.MongoDb.user.updateOne(
                  { _id: res.deviceID },
                  {
                    $set: {
                      instagramUser: Data.instagramUser,
                      freetime: followers.includes(Data.instagramUser) ? 1 : 0,
                      usedInstaTime: followers.includes(user.instagramUser)
                          ? new Date().toISOString()
                          : '',
                    },
                  }
                );
                response.end(
                  ConstantMethod.sucess(
                    JSON.stringify({
                      message: "instagram user added successfully!",
                    }),
                    200
                  )
                );
              }
            );
            break;
          case "runInstagramFollowersSchedule":
            delete Data["eventName"];
            var followers = await runPy.runBash();
            console.log(followers);
            constant.MongoDb.user
              .find({
                instagramUser: { $exists: true },
                freetime: 0,
                usedInstaTime: {$exists: true},
              })
              .toArray(async function (err, res) {
                if (err || res == null) {
                  response.end(ConstantMethod.Invalid());
                  return;
                }

                for (let i = 0; i < res.length; i++) {
                  const user = res[i];
                  constant.MongoDb.user.updateOne(
                    { _id: user.deviceID },
                    {
                      $set: {
                        freetime: followers.includes(user.instagramUser)
                          ? 1
                          : 0,
                        usedInstaTime: followers.includes(user.instagramUser)
                          ? new Date().toISOString()
                          : '',
                      },
                    }
                  );
                }
                response.end(
                  ConstantMethod.sucess(
                    JSON.stringify({
                      message: res,
                    }),
                    200
                  )
                );
              });
            break;
          case "sendNotification":
            delete Data["eventName"];
            constant.MongoDb.user.findOne(
              { _id: userData.deviceID },
              async function (err, res) {
                if (err || res == null) {
                  response.end(ConstantMethod.Invalid());
                  return;
                }

                admin
                  .messaging()
                  .sendToDevice(
                    res.firebaseToken,
                    {
                      notification: {
                        title: Data.title,
                        body: Data.body,
                      },
                    },
                    {
                      priority: "high",
                      timeToLive: 60 * 60 * 24,
                    }
                  )
                  .then(function (response) {
                    console.log("Successfully sent message:", response.results);
                  })
                  .catch(function (error) {
                    console.log("Error sending message:", error);
                  });
                response.end(
                  ConstantMethod.sucess(
                    JSON.stringify({
                      message: "notification sent successfully!",
                    }),
                    200
                  )
                );
              }
            );
            break;
          case "getMyFriend":
            delete Data["eventName"];
            constant.MongoDb.friend
              .aggregate([
                { $match: { _id: userData.deviceID } },
                { $unwind: "$accept" },
                {
                  $lookup: {
                    from: "user",
                    localField: "accept",
                    foreignField: "_id",
                    as: "userList",
                  },
                },
                { $unwind: "$userList" },
                {
                  $project: {
                    "userList._id": 0,
                    receive: 0,
                    accept: 0,
                    _id: 0,
                  },
                },
              ])
              .toArray(function (err, res) {
                if (!err && res != null && res.length > 0) {
                  response.end(
                    ConstantMethod.sucess(JSON.stringify(res[0]), 1)
                  );
                } else {
                  response.end(ConstantMethod.sucessWithCode(0)); //JSON.stringify("no friend found!!"),
                }
              });
            break;
          case "cancelMyRequest":
            constant.MongoDb.user.findOne(
              { userName: Data.userName },
              function (err, res) {
                if (!err && res != null) {
                  constant.MongoDb.friend.updateOne(
                    { _id: res.deviceID },
                    {
                      $pull: {
                        receive: { $in: [userData.deviceID] },
                      },
                    },
                    { upsert: true },
                    function (err, result) {
                      response.end(ConstantMethod.sucessWithCode(5)); //JSON.stringify("friend request removed."),
                    }
                  );
                } else {
                  response.end(ConstantMethod.sucessWithCode(0)); //JSON.stringify("no friend request found!!"),
                }
              }
            );

            break;
          case "friendRequestAccept":
            delete Data["eventName"];
            if (Data.hasOwnProperty("add") && Data["add"] === 0) {
              let batch = constant.MongoDb.friend.initializeUnorderedBulkOp({
                useLegacyOps: true,
              });
              batch.find({ _id: userData.deviceID }).update(
                {
                  $pull: {
                    receive: { $in: [Data.senderDeviceID] },
                    accept: { $in: [Data.senderDeviceID] },
                  },
                },
                { multi: true }
              );
              batch.find({ _id: Data.senderDeviceID }).update(
                {
                  $pull: {
                    receive: { $in: [userData.deviceID] },
                    accept: { $in: [userData.deviceID] },
                  },
                },
                { multi: true }
              );
              batch.execute(function (err, batchRes) {
                response.end(ConstantMethod.sucessWithCode(5)); //JSON.stringify("Connection removed."),
                constant.MongoDb.user.findOne(
                  { _id: Data.senderDeviceID },
                  function (err, res) {
                    if (!err && res != null && res.hasOwnProperty("socketId"))
                      constant.io.to(res.socketId).emit("signalClient", {
                        eventName: "friendConnectionRemoved",
                        status: 3,
                        deviceID: userData.deviceID,
                      });
                  }
                );
              });

              // constant.MongoDb.friend.updateOne(
              //     {_id: userData.deviceID},
              //     {
              //         $pull: {
              //             "receive": {$in: [Data.senderDeviceID]},
              //             "accept": {$in: [Data.senderDeviceID]}
              //         }
              //     },
              //     {upsert: true}
              //     , function (err, result) {
              //         response.end(ConstantMethod.sucess(JSON.stringify("Connection removed."), 4));
              //         constant.MongoDb.user.findOne(
              //             {_id: Data.senderDeviceID}
              //             , function (err, res) {
              //                 if (!err && res != null && res.hasOwnProperty("socketId"))
              //                     constant.io.to(res.socketId).emit("signalClient", {
              //                         eventName: "friendConnectionRemoved",
              //                         status: 3,
              //                         deviceID: userData.deviceID,
              //                     });
              //             })
              //     });
            } else {
              constant.MongoDb.friend.findOne(
                { accept: { $in: [Data.senderDeviceID] } },
                function (err, result) {
                  if (!err && result != null) {
                    response.end(ConstantMethod.sucessWithCode(4)); //JSON.stringify("It's already friend of someone."),
                  } else {
                    constant.MongoDb.friend.findOne(
                      {
                        _id: userData.deviceID,
                        receive: { $in: [Data.senderDeviceID] },
                      },
                      function (err, result) {
                        if (!err && result != null) {
                          constant.MongoDb.user.findOne(
                            { _id: Data.senderDeviceID },
                            function (err, result) {
                              if (!err && result != null) {
                                let batch =
                                  constant.MongoDb.friend.initializeUnorderedBulkOp(
                                    { useLegacyOps: true }
                                  );
                                batch.find({}).update(
                                  {
                                    $pull: {
                                      receive: { $in: [Data.senderDeviceID] },
                                    },
                                  },
                                  { multi: true }
                                );
                                batch
                                  .find({ _id: userData.deviceID })
                                  .upsert()
                                  .updateOne({
                                    $set: { userType: 2 },
                                    $addToSet: { accept: Data.senderDeviceID },
                                  });
                                batch
                                  .find({ _id: Data.senderDeviceID })
                                  .upsert()
                                  .updateOne({
                                    $set: { userType: 1 },
                                    $addToSet: { accept: userData.deviceID },
                                  });
                                batch.execute(function (err, batchRes) {
                                  constant.io
                                    .to(result.socketId)
                                    .emit("signalClient", {
                                      eventName: "friendAccepted",
                                      status: 3,
                                    });
                                  response.end(
                                    ConstantMethod.sucessWithCode(3)
                                  ); //JSON.stringify("Request accepted."),
                                });
                              } else {
                                response.end(ConstantMethod.sucessWithCode(0)); //JSON.stringify("User not found."),
                              }
                            }
                          );
                        } else {
                          response.end(ConstantMethod.sucessWithCode(-1)); //JSON.stringify("invalid request."),
                        }
                      }
                    );
                  }
                }
              );
            }
            break;
          case "listOfFriendRequest":
            delete Data["eventName"];
            constant.MongoDb.friend
              .aggregate([
                { $match: { _id: userData.deviceID } },
                { $unwind: "$receive" },
                {
                  $lookup: {
                    from: "user",
                    localField: "receive",
                    foreignField: "_id",
                    as: "userList",
                  },
                },
                { $unwind: "$userList" },
                {
                  $project: {
                    "userList._id": 0,
                    receive: 0,
                    accept: 0,
                    _id: 0,
                  },
                },
              ])
              .toArray(function (err, res) {
                if (!err && res != null && res.length > 0) {
                  response.end(ConstantMethod.sucess(JSON.stringify(res), 1));
                } else {
                  response.end(ConstantMethod.sucessWithCode(0)); //JSON.stringify("no friend request found!!"),
                }
              });
            break;
          case "userSubscription":
            delete Data["eventName"];
            constant.MongoDb.user.findOne(
              { _id: userData.deviceID },
              async function (err, res) {
                if (err || res == null) {
                  response.end(ConstantMethod.Invalid());
                  return;
                }

                await constant.MongoDb.user.updateOne(
                  { _id: res.deviceID },
                  { $set: { subscription: Data.subscription } }
                );
                response.end(
                  ConstantMethod.sucess(
                    JSON.stringify({
                      message: "Subscription changed successfully!",
                    }),
                    200
                  )
                );
              }
            );
            break;
          case "validateToken":
            delete Data["eventName"];

            response.end(
              ConstantMethod.sucess(
                JSON.stringify({ deviceID: userData.deviceID }),
                200
              )
            );

            break;
          case "sendFriendRequest":
            delete Data["eventName"];
            constant.MongoDb.user.findOne(
              { userName: Data.userName },
              function (err, res) {
                if (!err && res != null) {
                  if (res.deviceID === userData.deviceID) {
                    response.end(ConstantMethod.sucessWithCode(8)); //JSON.stringify("you can't send request to your self!!"),
                    return;
                  }
                  constant.MongoDb.friend.findOne(
                    {
                      _id: userData.deviceID,
                      receive: { $in: [res.deviceID] },
                    },
                    function (err, result) {
                      if (!err && result != null) {
                        let batch =
                          constant.MongoDb.friend.initializeUnorderedBulkOp({
                            useLegacyOps: true,
                          });
                        batch
                          .find({})
                          .update(
                            { $pull: { receive: { $in: [res.deviceID] } } },
                            { multi: true }
                          );
                        batch
                          .find({ _id: userData.deviceID })
                          .upsert()
                          .updateOne({
                            $set: { userType: 1 },
                            $addToSet: { accept: res.deviceID },
                          });
                        batch
                          .find({ _id: res.deviceID })
                          .upsert()
                          .updateOne({
                            $set: { userType: 2 },
                            $addToSet: { accept: userData.deviceID },
                          });
                        batch.execute(function (err, batchRes) {
                          constant.io.to(res.socketId).emit("signalClient", {
                            eventName: "friendAccepted",
                            status: 3,
                          });
                          response.end(ConstantMethod.sucessWithCode(3)); //JSON.stringify("Request accepted."),
                        });
                      } else {
                        constant.MongoDb.friend.updateOne(
                          { _id: res.deviceID },
                          { $addToSet: { receive: userData.deviceID } },
                          { upsert: true },
                          function (err, result) {
                            response.end(ConstantMethod.sucessWithCode(1)); //JSON.stringify("Request sent.")
                          }
                        );
                      }
                    }
                  );
                } else {
                  response.end(ConstantMethod.sucessWithCode(9));
                }
              }
            );

            break;

          default:
            response.status(500).send(ConstantMethod.Invalid());
            break;
        }
      }
    });
  },
});
