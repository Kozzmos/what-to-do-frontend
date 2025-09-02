import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { Link, useNavigate } from "react-router-dom"; // 👈 useNavigate eklendi
import { Form, Button, Card, Container, Row, Col } from "react-bootstrap";

export default function Register() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate(); // 👈 hook

    const handleRegister = async () => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            alert(error.message);
            return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();

        handleLogout();

        if (userError || !userData?.user) {
            alert("Kullanıcı bilgisi alınamadı.");
            return;
        }

        const userId = userData.user.id;



        const { error: insertError } = await supabase
            .from("usernames")
            .insert([{ user_id: userId, username }]);

        if (insertError) {
            alert("Username eklenirken hata oluştu: " + insertError.message);
            return;
        }

        alert("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.");

    };

    function handleLogout() {
        supabase.auth.signOut()
            .then(() => {
                navigate("/login");
            })
            .catch(error => {
                console.error('Logout error:', error);
            });
    }

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <h2 className="mb-4 text-center">Kayıt Ol</h2>
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
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
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
                                <Button onClick={handleRegister}>Kayıt Ol</Button>
                            </Form>
                            <hr />
                            <div className="text-center">
                                <span>Zaten hesabınız var mı? </span>
                                <Link to="/login">Giriş Yap</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
