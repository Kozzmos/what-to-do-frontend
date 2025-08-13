import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from "react-simple-captcha";
import { Link } from "react-router-dom";
import { Form, Button, Card, Container, Row, Col, Spinner } from "react-bootstrap";

export default function GuestLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");

    // Captcha sadece misafir girişi için açılıyor
    useEffect(() => {
        if (showCaptcha) loadCaptchaEnginge(6);
    }, [showCaptcha]);

    // Normal email + password
    const handleLoginPass = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            window.alert(error.message);
        } else {
            window.alert("Login successful");
        }
    };

    // Misafir (anon) giriş — sadece captcha doğrulamasıyla
    const handleLoginAnon = async () => {
        if (!validateCaptcha(captchaInput)) {
            window.alert("Captcha is incorrect!");
            return;
        }
        const { error } = await supabase.auth.signInAnonymously({
            // İstersen captcha token'ı server tarafında doğrulamak için options içine koyabilirsin
            // options: { captchaToken: captchaInput }
        });
        if (error) {
            window.alert(error.message);
        } else {
            window.alert("Guest login successful");
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <h2 className="mb-4 text-center">Guest Login</h2>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="username"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </Form.Group>
                                <div className="d-flex gap-2">
                                    <Button onClick={handleLoginPass} disabled={loading}>
                                        {loading ? <Spinner animation="border" size="sm" /> : "Login"}
                                    </Button>
                                </div>
                            </Form>

                            {showCaptcha && (
                                <div className="mt-3">
                                    <LoadCanvasTemplate />
                                    <Form.Control
                                        className="mt-2"
                                        type="text"
                                        placeholder="Enter captcha"
                                        value={captchaInput}
                                        onChange={(e) => setCaptchaInput(e.target.value)}
                                    />
                                    <Button
                                        variant="warning"
                                        className="mt-2"
                                        onClick={handleLoginAnon}
                                    >
                                        Continue as Guest
                                    </Button>
                                </div>
                            )}

                            <hr />
                            <div className="text-center">
                                <span>You have a normal account? </span>
                                <Link to="/login">Login</Link>
                            </div>
                            <div className="text-center">
                                <span>Don’t have an account? </span>
                                <Link to="/register">Register</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}