export declare const Languages: {
    readonly English: "en";
    readonly Polish: "pl";
    readonly German: "de";
};
export type Language = typeof Languages[keyof typeof Languages];
export declare const Genders: {
    readonly Male: "male";
    readonly Female: "female";
    readonly Croissant: "croissant";
    readonly PreferNotSay: "preferNotSay";
};
export type Gender = typeof Genders[keyof typeof Genders];
export declare const Events: {
    readonly Message: "message";
    readonly JoinedRoom: "joinedRoom";
    readonly Typing: "typing";
    readonly StrangerLeftRoom: "strangerLeftRoom";
    readonly JoinQueue: "joinQueue";
    readonly CancelQueue: "cancelQueue";
    readonly LeaveRoom: "leaveRoom";
    readonly SendMessage: "sendMessage";
    readonly OnlineCount: "onlineCount";
    readonly Disconnect: "disconnect";
    readonly GetOnlineCount: "getOnlineCount";
    readonly GetUserId: "getUserId";
    readonly UserId: "userId";
    readonly Connection: "connection";
    readonly Error: "error";
};
export type Event = typeof Events[keyof typeof Events];
//# sourceMappingURL=enums.d.ts.map