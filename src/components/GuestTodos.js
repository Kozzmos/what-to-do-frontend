import React, { useEffect, useState } from "react";
import api from "../api";
import { Form, Button, ListGroup, Badge, Spinner } from "react-bootstrap";
import {supabase} from "./supabaseClient";
import { FaRegCalendarAlt, FaTrophy, FaCheckCircle } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";


function GuestTodos({ selectedList }) {
    const [todos, setTodos] = useState([]);
    const [filteredTodos, setFilteredTodos] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [newTodoText, setNewTodoText] = useState("");
    const [newTodoTags, setNewTodoTags] = useState("");
    const [newTodoDueDate, setNewTodoDueDate] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [editingList, setEditingList] = useState(null);
    const [editingDueDate, setEditingDueDate] = useState(null);
    const [editingTags, setEditingTags] = useState("");
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("");
    const [selectedTagFilter, setSelectedTagFilter] = useState("");
    const [allTags, setAllTags] = useState([]);
    const [activeScreen, setActiveScreen] = useState("Inbox");
    const [showCalendar, setShowCalendar] = useState(false);
    const [dailyGoal, setDailyGoal] = useState(5);
    const [todayCount, setTodayCount] = useState(0);
    const [lastCountDate, setLastCountDate] = useState(new Date().toDateString());


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

    useEffect(() => {
        if (userId) {
            fetchTodos();
        }
    }, [selectedList, userId]);


    const fetchTodos = () => {
        console.log("fetchTodos userId:", userId);
        setLoading(true);

        if (!selectedList || selectedList === "all") {
            api.get("/todos", { params: { user_id: userId } })
                .then(res => {
                    setTodos(res.data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            api.get("/todos", {
                params: { listId: selectedList.id, user_id: userId }
            })
                .then(res => {
                    setTodos(res.data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    };


    useEffect(() => {
        let filtered = todos;

        if (statusFilter !== "all") {
            filtered = filtered.filter(todo => todo.status === statusFilter);
        }
        if (searchTerm.trim() !== "") {
            filtered = filtered.filter(todo =>
                todo.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredTodos(filtered);
    }, [todos, statusFilter, searchTerm]);

    const addTodo = () => {
        if (!newTodoText.trim()) return;

        const tagsArray = newTodoTags
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0);

        api.post("/todos", {
            list_id: selectedList?.id || null,
            text: newTodoText,
            status: "New",
            active: true,
            due_date: newTodoDueDate || null,
            tags: tagsArray
        })
            .then(res => {
                setTodos([...todos, res.data]);
                setNewTodoText("");
                setNewTodoDueDate("");
                setNewTodoTags("");
            })
            .catch(err => {
                if (err.response && err.response.status === 403) {
                    window.alert(err.response.data.error || "Günlük limit aşıldı!");
                } else {
                    console.error(err);
                    window.alert("Bir hata oluştu.");
                }
            });
    };



    const deleteTodo = (id) => {
        if (!window.confirm("Bu yapılacak öğeyi silmek istediğine emin misin?")) return;

        api.delete(`/todos/${id}`)
            .then(() => {
                setTodos(todos.filter(t => t.id !== id));
            })
            .catch(console.error);
    };

    const updateTodoStatus = (id, status) => {
        const payload = { status };
        if (status === "Completed") {
            payload.completed_at = new Date().toISOString().split("T")[0]; // tamamlanma zamanı
        } else {
            payload.completed_at = null;
        }

        api.put(`/todos/${id}`, payload)
            .then(res => {
                setTodos(todos.map(todo => (todo.id === id ? res.data : todo)));
            })
            .catch(console.error);
    };

    useEffect(() => {
        // Listeleri yükle
        async function fetchLists() {
            const { data, error } = await supabase
                .from("list")
                .select("*")
                .eq("user_id", userId);
            if (data) setLists(data);
        }
        if (userId) fetchLists();
    }, [userId]);


    useEffect(() => {
        let filtered = todos;

        // Status, tag, arama filtreleri
        if (statusFilter !== "all") {
            filtered = filtered.filter(todo => todo.status === statusFilter);
        }
        if (selectedTagFilter) {
            filtered = filtered.filter(todo => todo.tags && todo.tags.includes(selectedTagFilter));
        }
        if (searchTerm.trim() !== "") {
            filtered = filtered.filter(todo =>
                todo.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Ekran filtresi
        const today = new Date();
        today.setHours(0,0,0,0);

        setFilteredTodos(filtered);
    }, [todos, statusFilter, selectedTagFilter, searchTerm, activeScreen]);

    const completedToday = todos.filter(todo => {
        if (todo.status !== "Completed" || !todo.completed_at) return false;
        const completed = new Date(todo.completed_at);
        const today = new Date();
        return completed.toDateString() === today.toDateString();
    }).length;



    return (
        <>

            <h2>Yapılacaklar</h2>

            <Form className="mb-3 d-flex gap-2 flex-wrap align-items-center">
                <Form.Group controlId="statusFilter" className="d-flex align-items-center">
                    <Form.Label className="me-2 mb-0">Durum:</Form.Label>
                    <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">Tümü</option>
                        <option value="New">Yeni</option>
                        <option value="Completed">Tamamlandı</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group controlId="searchTerm" className="d-flex align-items-center flex-grow-1">
                    <Form.Control
                        type="search"
                        placeholder="Ara..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </Form.Group>
                <Button onClick={addTodo}>Ekle</Button>
            </Form>

            <Form className="mb-3 d-flex gap-2">
                <Form.Control
                    placeholder="Yeni yapılacak..."
                    value={newTodoText}
                    onChange={e => setNewTodoText(e.target.value)}
                />
                <Form.Control
                    type="date"
                    value={newTodoDueDate}
                    onChange={e => setNewTodoDueDate(e.target.value)}
                    style={{ maxWidth: "160px" }}
                />
            </Form>

            <div className="mb-3 d-flex gap-2">
                <Button
                    variant={activeScreen === "Inbox" ? "primary" : "outline-primary"}
                    onClick={() => setActiveScreen("Inbox")}
                >
                    Inbox
                </Button>
                <div className="d-flex align-items-center" style={{marginLeft: "auto", marginRight: "10px"}}>
                    <span style={{ fontWeight: "bold", marginRight: "8px" }}>
                        Günlük Hedef:
                    </span>
                    {completedToday >= dailyGoal && (
                        <FaTrophy color="gold" size={24} className="me-2" />
                    )}
                    <FaCheckCircle className="me-2" />
                    <span>
                        {completedToday} /{" "}
                        <input
                            type="number"
                            min={1}
                            value={dailyGoal}
                            onChange={e => setDailyGoal(Number(e.target.value))}
                            style={{
                                width: "48px",
                                display: "inline-block",
                                margin: "0 4px",
                                fontWeight: "bold",
                                textAlign: "center"
                            }}
                        />
                        {" "}
                </span>
                </div>
                <Button
                    variant={showCalendar ? "primary" : "outline-secondary"}
                    onClick={() => setShowCalendar(!showCalendar)}
                >
                    Takvim
                </Button>
            </div>

            {loading && <div className="text-center"><Spinner animation="border" /></div>}

            {showCalendar ? (
                <div
                    className="calendar-wrapper"
                    style={{
                        maxWidth: "1200px",
                        margin: "0 auto",
                        height: "550px" // Yüksekliği artırabilirsin
                    }}
                >
                    <Calendar
                        className="w-100 h-100"
                        tileContent={({ date, view }) => {
                            if (view === "month") {
                                const dayTodos = todos.filter(todo =>
                                    todo.due_date &&
                                    new Date(todo.due_date).toDateString() === date.toDateString()
                                );
                                if (dayTodos.length === 0) return null;
                                return (
                                    <span>
                                        <Badge bg="info" className="d-block mb-1" style={{ fontSize: "0.8em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {dayTodos[0].text}
                                        </Badge>
                                        {dayTodos.length > 1 && (
                                            <Badge bg="secondary" style={{ fontSize: "0.7em" }}>
                                                +{dayTodos.length - 1}
                                            </Badge>
                                        )}
                                    </span>
                                );
                            }
                        }}
                    />
                </div>
            ) : (
                <ListGroup>
                    {filteredTodos.map(todo => (
                        <ListGroup.Item
                            key={todo.id}
                            className="d-flex justify-content-between align-items-center"
                        >
                                <>
                                    <div>
                                        <strong>{todo.text}</strong>{" "}
                                        <Badge bg={todo.status === "Completed" ? "success" : "warning"}>
                                            {todo.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        {todo.due_date && (
                                            <Badge bg="light" text="dark" className="d-flex align-items-center" style={{ fontSize: "0.95em", padding: "6px 10px" }}>
                                                <FaRegCalendarAlt className="me-1" />
                                                {new Date(todo.due_date).toLocaleDateString("tr-TR")}
                                            </Badge>
                                        )}
                                    </div>
                                    <div>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            className="me-2"
                                            onClick={() => deleteTodo(todo.id)}
                                        >
                                            Sil
                                        </Button>
                                        {todo.status !== "Completed" && (
                                            <Button
                                                size="sm"
                                                variant="outline-success"
                                                onClick={() => updateTodoStatus(todo.id, "Completed")}
                                            >
                                                Tamamla
                                            </Button>
                                        )}
                                    </div>
                                </>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}

        </>
    );
}

export default GuestTodos;
