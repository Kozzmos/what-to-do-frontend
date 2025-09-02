import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom";
import { Form, Button, Card, Container, Row, Col, Spinner } from "react-bootstrap";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);


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

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <h2 className="mb-4 text-center">Login</h2>
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
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Form.Group>
                                <div className="d-flex gap-2">
                                    <Button onClick={handleLoginPass} disabled={loading}>
                                        {loading ? <Spinner animation="border" size="sm" /> : "Login"}
                                    </Button>
                                    <Button variant="warning">
                                        <Link to="/guest-login" style={{ textDecoration: "inherit", color: "inherit"}}>Guest Login</Link>
                                    </Button>
                                </div>
                            </Form>
                            <hr />
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
