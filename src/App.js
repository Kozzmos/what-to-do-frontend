import React, {use, useEffect, useState} from "react";
import { Buffer } from 'buffer';
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import { supabase } from "./components/supabaseClient";
import MainApp from "./components/MainApp";
import GuestLogin from "./components/GuestLogin";

window.Buffer = window.Buffer || Buffer;

function App() {
    const [selectedList, setSelectedList] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        async function getUser(){
            const { data } = await supabase.auth.getUser();
            setUser(data?.user ?? null);
            setLoading(false);
        }
        getUser();

        const { data: { subscription} } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return() => {
            subscription.unsubscribe();
        }
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/"/> : <Login />} />
                <Route path="/register" element={user ? <Navigate to="/"/> : <Register />} />
                <Route path="/guest-login" element={user ? <Navigate to="/"/> : <GuestLogin />} />
                <Route path="/" element={user ? <MainApp user={user} /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
