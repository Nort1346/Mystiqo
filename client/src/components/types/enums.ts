export enum Status {
    Home = 'home',
    Queue = 'queue',
    Chat = 'chat'
}

export enum ChatStatus {
    Active = 'active',
    Inactive = 'inactive'
}

export enum Language {
    English = 'en',
    Polish = 'pl',
    German = 'de'
};

export enum Gender {
    Male = 'male',
    Female = 'female',
    Croissant = 'croissant',
    PreferNotSay = 'preferNotSay'
};

export enum Events {
    Message = 'message',
    JoinedRoom = 'joinedRoom',
    Typing = 'typing',
    StrangerLeftRoom = 'strangerLeftRoom',
    JoinQueue = 'joinQueue',
    CancelQueue = 'cancelQueue',
    LeaveRoom = 'leaveRoom',
    SendMessage = 'sendMessage',
    UserId = 'userId',
    GetUserId = 'getUserId',
    Connect = 'connect',
    GetOnlineCount = 'getOnlineCount',
    OnlineCount = 'onlineCount'
}