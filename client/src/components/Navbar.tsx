import React, { useEffect, useState } from "react";
import { Navbar, Nav, Alert } from 'react-bootstrap';
import { socket } from "../socket";
import { Events } from "./types/enums";

function NavBar({ goToHome }: { goToHome: () => void }) {
    const [onlineCount, setOnlineCount] = useState<number>(0);

    useEffect(() => {
        function onOnlineCount(count: number) {
            setOnlineCount(count);
        }

        socket.emit(Events.GetOnlineCount);
        socket.on(Events.OnlineCount, onOnlineCount);
        return () => {
            socket.off(Events.OnlineCount, onOnlineCount);
        };
    }, []);

    return (
        <Navbar className='px-3' style={{ height: '60px', fontFamily: 'Space Mono' }}>
            <Navbar.Brand onClick={goToHome}>Mystiqo</Navbar.Brand>
            <Nav className="ms-auto d-flex align-items-center">
                <Alert variant="success" className='rounded-pill p-1 px-2 m-0 fs-6'>
                    Online: {onlineCount}
                </Alert>
            </Nav>
        </Navbar>
    )
}

export default NavBar;