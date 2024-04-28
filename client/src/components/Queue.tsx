import React from "react";
import { Spinner, Button } from 'react-bootstrap';

function Queue({ cancelQueue }: { cancelQueue: () => void }) {
    return (
        <div className='h-75vh d-flex align-items-center justify-content-center flex-column text-center'>
            <h1>Waiting for stranger...</h1>
            <p className='text-primary-emphasis'><Spinner animation="grow" /></p>
            <Button variant='danger rounded-pill' size="lg" onClick={cancelQueue}>Cancel</Button>
        </div>
    )
}

export default Queue;