"use strict";

let _this = this;

module.exports.sucess = function GetSucess(data, status) {

    return '{"code":200, "data":' + data + ',"status":' + status + '}'

};

module.exports.sucessWithCode = function GetSucess(status) {

    return '{"code":200 ,"status":' + status + '}'

};


module.exports.Invalid = function
    GetError() {

    return '{"code":400,"data":you broke the internet!,"message":"failed."}'

};


module.exports.Error = function
    GetError(result) {
    return '{"code":204,"data":' + result + ',"message":"failed."}'


};
