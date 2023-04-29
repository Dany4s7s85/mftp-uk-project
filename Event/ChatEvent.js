"use strict";

var _this = module.exports = {
    isUserAgent: function (data, constant, socket) {
        constant.MongoDb.user.findOne(
            {_id: data.userId}
            , function (err, res) {
                if (!err && res != null)
                    socket.emit('VideoClient', {
                        eventName: data.eventName,
                        isUserAgent: res.payload.master_id,
                    });
            })
    },

    isStatus: function (data, constant, socket) {

        delete data["eventName"];
        let set;
        if (data.Isonline > 0) {
            set = {$set: {socketId: socket.id}}
        } else {
            set = {$unset: {socketId: ""}}
        }
        console.log(set)
        constant.MongoDb.user.updateOne(
            {_id: data.deviceID},
            set
            , function (err, result) {

            });
    }, sendSignal: function (data, constant, socket) {
        delete data["eventName"];
        constant.MongoDb.user.findOne(
            {_id: data.deviceID}
            , function (err, res) {
                if (!err && res != null && res.hasOwnProperty("socketId"))
                    constant.io.to(res.socketId).emit('signalClient', {
                        eventName: 'signalData',
                        signalData: data.signalData,
                        deviceID: data.deviceID
                    });
            })


    }

};
