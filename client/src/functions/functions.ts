import messageAppearSound from '../sound-effects/messageAppear.wav';
import joinedRoom from '../sound-effects/joinedRoom.wav';

export function isMobileDevice() {
    return window.innerWidth <= 768;
}

export function playMessageAppearSound() {
    new Audio(messageAppearSound).play();
}

export function playJoinRoomSound() {
    new Audio(joinedRoom).play();
}