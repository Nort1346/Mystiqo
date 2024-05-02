"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = exports.Gender = exports.Language = void 0;
var Language;
(function (Language) {
    Language["English"] = "en";
    Language["Polish"] = "pl";
    Language["German"] = "de";
})(Language = exports.Language || (exports.Language = {}));
;
var Gender;
(function (Gender) {
    Gender["Male"] = "male";
    Gender["Female"] = "female";
    Gender["Croissant"] = "croissant";
    Gender["PreferNotSay"] = "preferNotSay";
})(Gender = exports.Gender || (exports.Gender = {}));
;
var Events;
(function (Events) {
    Events["Message"] = "message";
    Events["JoinedRoom"] = "joinedRoom";
    Events["Typing"] = "typing";
    Events["StrangerLeftRoom"] = "strangerLeftRoom";
    Events["JoinQueue"] = "joinQueue";
    Events["CancelQueue"] = "cancelQueue";
    Events["LeaveRoom"] = "leaveRoom";
    Events["SendMessage"] = "sendMessage";
    Events["OnlineCount"] = "onlineCount";
    Events["Disconnect"] = "disconnect";
    Events["GetOnlineCount"] = "getOnlineCount";
    Events["GetUserId"] = "getUserId";
    Events["UserId"] = "userId";
    Events["Connection"] = "connection";
})(Events = exports.Events || (exports.Events = {}));
