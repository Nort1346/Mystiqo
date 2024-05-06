import React from 'react';
import { Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

function ConnectionStatusModal({ show }: { show: boolean }) {
    const { t } = useTranslation();
    return (
        <Modal show={show} centered>
            <Modal.Header>
                <Modal.Title>{t('ConnectionStatus.disconnected')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>{t('ConnectionStatus.theServerHasBeenDisconnected')}</p>
            </Modal.Body>
        </Modal>
    );
}

export default ConnectionStatusModal;