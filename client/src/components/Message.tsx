import React from "react";
import { MessageData } from "../App";

function Message({ message, userId }: { message: MessageData, userId: string }) {
    const isMe = userId === message.authorId;

    const formatContent = (text: string) => {
        const linkRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(linkRegex);
        return parts.map((part, index) => {
            if (part.match(linkRegex)) {
                return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer">
                        {part}
                    </a>
                );
            } else {
                return part;
            }
        });
    };

    if (message.authorId === 'SYSTEM') {
        return (
            <div className={`d-flex justify-content-center my-2`}>
                <span className={`fw-bold py-1 px-2 w-auto text-wrap text-break mx-5`}>
                    {formatContent(message.content)}
                </span>
            </div>
        )
    }

    return (
        <div className={`d-flex justify-content-${isMe ? 'end' : 'start'} my-1`}>
            <span className={`rounded-top bg-${isMe ? 'success' : 'primary'} ${isMe ? 'rounded-start' : 'rounded-end'} py-1 px-2 w-auto text-wrap text-break m${isMe ? 's' : 'e'}-5`}>
                {formatContent(message.content)}
            </span>
        </div>
    )
}

export default Message;