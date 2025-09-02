import React, {useEffect, useState} from "react";
import List from "./List";
import Todos from "./Todos";
import {supabase} from "./supabaseClient";
import { useNavigate } from 'react-router-dom';
import {Container, Row, Col, Button, Form} from "react-bootstrap";

function MainApp({ user }) {
    const [selectedList, setSelectedList] = useState(null);
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("");

    useEffect(() => {
        async function fetchUser() {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUserId(data.user.id);
            }
        }
        fetchUser();
    }, []);

    useEffect(() => {
        async function fetchUsername() {
            if (userId) {
                const { data, error } = await supabase
                    .from("usernames")
                    .select("username")
                    .eq("user_id", userId)
                    .single();
                if (data) setUsername(data.username);
            }
        }
        fetchUsername();
    }, [userId]);


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
        <Container id="MainAppBu" fluid className="p-3" style={{ height: "100vh" }}>
            {/* Navbar */}
            <div style={{
                width: "100%",
                height: "60px",
                background: "#f8f9fa",
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
                marginBottom: "5px",
                justifyContent: "space-between"
            }}>
                <div style={{ fontWeight: "bold" }}>
                    Hoşgeldin {username ? username : ""}
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", textAlign: "center" }}>
                    What To Do <span style={{ fontSize: "0.9rem", color: "#888", marginLeft: 8 }}>v3.0</span>
                </div>
                <div style={{ width: 120 }}></div> {/* Sağda boşluk, istersen başka şey ekleyebilirsin */}
            </div>
            <Row className="h-100">
                <Col md={4} className="border-end overflow-auto">
                    <List selectedList={selectedList} onSelectList={setSelectedList} user={user} />
                </Col>
                <Col md={8} className="overflow-auto">
                    <Todos selectedList={selectedList} user={user} />
                    <div style={{display: "flex", justifyContent: "end", alignContent: "end", marginTop: 20}}>
                        <Button variant="info" style={{color: "white"}} onClick={handleLogout}>Hesaptan Çıkış</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default MainApp;
