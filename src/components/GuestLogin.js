import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from "react-simple-captcha";
import { Link } from "react-router-dom";
import { Form, Button, Card, Container, Row, Col, Spinner } from "react-bootstrap";

export default function GuestLogin() {
    const [captchaInput, setCaptchaInput] = useState("");
    const [showCaptcha, setShowCaptcha] = useState(true);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");

    // Captcha sadece misafir girişi için açılıyor
    useEffect(() => {
        if (showCaptcha) loadCaptchaEnginge(6);
    }, [showCaptcha]);

    // Normal email + password
    const handleLoginGuest = async () => {
        if (!validateCaptcha(captchaInput)) {
            window.alert("Captcha is incorrect!");
            return;
        }
        setLoading(true);
        const email = `${username}@gmail.com`;
        const password = "guest_pass";
        // Önce login dene
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            // Kullanıcı yoksa register dene
            if (error.message.includes("Invalid login credentials")) {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
                if (signUpError) {
                    setLoading(false);
                    window.alert(signUpError.message);
                    return;
                }
                // Kayıt başarılıysa user_id al ve tabloya ekle
                const userId = signUpData?.user?.id;
                if (userId) {
                    await supabase.from("usernames").insert([
                        { user_id: userId, username }
                    ]);
                }
                // Kayıt sonrası tekrar login dene
                const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
                setLoading(false);
                if (loginError) {
                    window.alert(loginError.message);
                } else {
                    window.alert("Guest account created and logged in!");
                }
            } else {
                setLoading(false);
                window.alert(error.message);
            }
        } else {
            setLoading(false);
            window.alert("Login successful");
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
                                            onClick={handleLoginGuest}
                                            disabled={loading}
                                        >
                                            {loading ? <Spinner animation="border" size="sm" /> : "Continue as Guest"}
                                        </Button>
                                    </div>
                                )}
                        </Form>
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