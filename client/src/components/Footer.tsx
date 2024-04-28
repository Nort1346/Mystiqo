import React from "react";
import { Row, Col } from 'react-bootstrap';
import { FaGithub } from "react-icons/fa";

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mx-3 mb-3">
            <Row>
                <Col className="text-md-start text-center p-0" md={8} xs={12}>
                    <p>
                        © {currentYear} Mystiqo. All rights reserved.
                    </p>
                </Col>
                <Col md={4} xs={12} className="d-flex justify-content-center justify-content-md-end">
                    <a href="https://github.com/Nort1346" target="_blank" aria-label="Visit GitHub profile" rel="noreferrer">
                        <FaGithub size="1.5em" />
                    </a>
                </Col>
            </Row>
        </footer>
    );
}

export default Footer;