import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from "react-simple-captcha";
import { Link } from "react-router-dom";
import { Form, Button, Card, Container, Row, Col, Spinner } from "react-bootstrap";
import {v4 as uuidv4} from "uuid";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (showCaptcha) {
            loadCaptchaEnginge(6);
        }
    }, [showCaptcha]);


    const handleLoginPass = async () => {
        if (!validateCaptcha(captchaInput) && showCaptcha) {
            alert("Captcha yanlış!");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            alert(error.message);
        } else {
            alert("Giriş başarılı");
        }
    };

    const handleLoginGuest = async () => {
        if (!validateCaptcha(captchaInput)) {
            alert("Captcha yanlış!");
            return;
        }
        const { error } = await supabase.auth.signInAnonymously();
        const randomEmail = `guest_${uuidv4()}@example.com`;
        const randomPassword = uuidv4();

        const {data, erroro} = await supabase.auth.signUp({
            email: randomEmail,
            password: randomPassword,
        });

        if(erroro){
            alert("Misafir girişi başarısız: " + erroro.message);
            return;
        }

        const {data: userData, error: userError} = await supabase.auth.getUser();
        if(userError || !userData?.user){
            alert("Kullanıcı bilgisi alınamadı.")
            return;
        }

        const userId = userData.user.id;
        const guestUsername = `guest_${userId.slice(0, 8)}`;

        const{error: insertError} = await supabase
            .from("usernames")
            .insert([{user_id: userId, username: guestUsername}]);

        if (insertError) {
            alert("Misafir kullanıcı adı eklenirken hata oluştu " + insertError.message);
            return;
        }

        alert("Misafir girişi başarılı");
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <h2 className="mb-4 text-center">Giriş Yap</h2>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Şifre</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Şifre"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Form.Group>
                                <div className="d-flex gap-2">
                                    <Button onClick={handleLoginPass} disabled={loading}>
                                        {loading ? <Spinner animation="border" size="sm" /> : "Giriş Yap"}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowCaptcha(true)}
                                    >
                                        Misafir Girişi
                                    </Button>
                                </div>
                            </Form>

                            {showCaptcha && (
                                <div className="mt-3">
                                    <LoadCanvasTemplate />
                                    <Form.Control
                                        className="mt-2"
                                        type="text"
                                        placeholder="Captcha'yı girin"
                                        value={captchaInput}
                                        onChange={(e) => setCaptchaInput(e.target.value)}
                                    />
                                    <Button
                                        variant="warning"
                                        className="mt-2"
                                        onClick={handleLoginGuest}
                                    >
                                        Anonim Giriş
                                    </Button>
                                </div>
                            )}

                            <hr />
                            <div className="text-center">
                                <span>Hesabınız yok mu? </span>
                                <Link to="/register">Kayıt Ol</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
