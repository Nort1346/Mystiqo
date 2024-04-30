import React from "react";
import { Spinner, Button } from 'react-bootstrap';
import { useTranslation } from "react-i18next";

function Queue({ cancelQueue }: { cancelQueue: () => void }) {
    const { t } = useTranslation();
    return (
        <div className='h-75vh d-flex align-items-center justify-content-center flex-column text-center'>
            <h1>{t('Queue.waitingForStranger')}</h1>
            <div className='text-primary-emphasis mb-3'><Spinner animation="grow" /></div>
            <Button variant='danger rounded-pill' size="lg" onClick={cancelQueue}>{t('Button.cancel')}</Button>
        </div>
    )
}

export default Queue;