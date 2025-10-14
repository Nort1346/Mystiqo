import { Gender, Language } from "./enums";
export interface User {
    id: string;
    roomId: `room-${string}` | null;
}
export interface QueueItem {
    gender: Gender;
    language: Language;
    preferGender: Gender;
}
//# sourceMappingURL=interfaces.d.ts.map