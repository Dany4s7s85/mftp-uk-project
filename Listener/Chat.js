/**
 * Created by manoj miyani on 09/05/15.
 */
/******************************************/
"use strict";
let constant = null;
let ConstantMethod = require('../Utils/ConstantMethod');
let ChatEvent = require('../Event/ChatEvent');
var _this = module.exports = {

    init: function (_constant) {
        constant = _constant;
        setEventHandlers();

    }
};

function setEventHandlers() {
    // console.log('setEventHandlers called !! ');

    constant.io.on("connection", function (socket) {
        console.log('Socket conneced !! -->', socket.id);

        socket.on('signalServer', function (data) {
            console.log('>>> INPUT DATA >>>>> ', data);
            if (data === null)
                return
            if (data.eventName === 'UserStatus') {

                ChatEvent.isUserAgent(data, constant, socket);
            } else if (data.eventName === 'isStatus') {
                ChatEvent.isStatus(data, constant, socket);
            }else if (data.eventName === 'sendSignal') {
                ChatEvent.sendSignal(data, constant, socket);
            }
        });
    });
}


