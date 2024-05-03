import messageAppearSound from '../sound_effects/messageAppear.wav';
import joinedRoom from '../sound_effects/joinedRoom.wav';

export function isMobileDevice() {
    return window.innerWidth <= 768;
}

export function playMessageAppearSound() {
    new Audio(messageAppearSound).play();
}

export function playJoinRoomSound() {
    new Audio(joinedRoom).play();
}