import React, { useEffect, useState } from "react";
import { Navbar, Nav, Alert } from 'react-bootstrap';
import { socket } from "../socket";

function NavBar() {
    const [onlineCount, setOnlineCount] = useState<number>(0);

    useEffect(() => {

        function onOnlineCount(count: number) {
            setOnlineCount(count);
        }

        socket.emit('getOnlineCount');
        socket.on('onlineCount', onOnlineCount);
        return () => {
            socket.off('onlineCount', onOnlineCount);
        };
    }, []);

    return (
        <Navbar className='px-3'>
            <Navbar.Brand>Mystiqo</Navbar.Brand>
            <Nav className="ms-auto d-flex align-items-center">
                <Alert variant="success" className='rounded-pill font-monospace p-1 m-0 fs-6'>
                    Online: {onlineCount}
                </Alert>
            </Nav>
        </Navbar>
    )
}

export default NavBar;