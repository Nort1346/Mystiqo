import { Gender, Language } from "./enums";

export interface User {
    id: string,
    roomId: string | null
}

export interface QueueItem {
    gender: Gender;
    language: Language;
    preferGender: Gender;
};