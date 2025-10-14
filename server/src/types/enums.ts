export const Languages = {
    English: 'en',
    Polish: 'pl',
    German: 'de'
} as const;

export type Language = typeof Languages[keyof typeof Languages];

export const Genders = {
    Male: 'male',
    Female: 'female',
    Croissant: 'croissant',
    PreferNotSay: 'preferNotSay'
} as const;

export type Gender = typeof Genders[keyof typeof Genders];

export const Events = {
    Message: 'message',
    JoinedRoom: 'joinedRoom',
    Typing: 'typing',
    StrangerLeftRoom: 'strangerLeftRoom',
    JoinQueue: 'joinQueue',
    CancelQueue: 'cancelQueue',
    LeaveRoom: 'leaveRoom',
    SendMessage: 'sendMessage',
    OnlineCount: 'onlineCount',
    Disconnect: 'disconnect',
    GetOnlineCount: 'getOnlineCount',
    GetUserId: 'getUserId',
    UserId: 'userId',
    Connection: 'connection',
    Error: 'error'
} as const;

export type Event = typeof Events[keyof typeof Events];