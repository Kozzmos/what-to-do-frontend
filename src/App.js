import React, {use, useEffect, useState} from "react";
import { Buffer } from 'buffer';
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import { supabase } from "./components/supabaseClient";
import MainApp from "./components/MainApp";
import GuestLogin from "./components/GuestLogin";
import GuestApp from "./components/GuestApp";

window.Buffer = window.Buffer || Buffer;

function App() {
    const [selectedList, setSelectedList] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        setLoading(true);
        async function getUser(){
            const { data } = await supabase.auth.getUser();
            const currentUser = data?.user ?? null;
            setUser(currentUser);

            if( currentUser?.email?.startsWith("guest_")){
                setIsGuest(true);
            }
            else {
                setIsGuest(false);
            }
            setLoading(false);
        }
        getUser();

        const { data: { subscription} } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser?.email?.startsWith("guest_")) {
                setIsGuest(true);
            } else {
                setIsGuest(false);
            }
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
                <Route path="/guest-login" element={user ? <Navigate to="/guest"/> : <GuestLogin />} />
                <Route path="/guest" element={<GuestApp />} />
                <Route path="/" element={user ? <MainApp user={user} /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
