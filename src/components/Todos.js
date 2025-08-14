import React, { useEffect, useState } from "react";
import api from "../api";
import { Form, Button, ListGroup, Badge, Spinner } from "react-bootstrap";
import {supabase} from "./supabaseClient";
import { FaRegCalendarAlt, FaTrophy, FaCheckCircle } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";


function Todos({ selectedList }) {
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

    useEffect(() => {
        // todos değiştiğinde tüm etiketleri topla
        const tagSet = new Set();
        todos.forEach(todo => {
            if (todo.tags && Array.isArray(todo.tags)) {
                todo.tags.forEach(tag => tagSet.add(tag));
            }
        });
        setAllTags(Array.from(tagSet));
    }, [todos]);

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
        }).then(res => {
            setTodos([...todos, res.data]);
            setNewTodoText("");
            setNewTodoDueDate("");
            setNewTodoTags("");
        }).catch(console.error);
    };

    const deleteTodo = (id) => {
        if (!window.confirm("Bu yapılacak öğeyi silmek istediğine emin misin?")) return;

        api.delete(`/todos/${id}`)
            .then(() => {
                setTodos(todos.filter(t => t.id !== id));
            })
            .catch(console.error);
    };

    const startEditing = (todo) => {
        setEditingId(todo.id);
        setEditingText(todo.text);
        setEditingList(todo.list_id || null);
        setEditingDueDate(todo.due_date ? todo.due_date.slice(0, 10) : "");
        setEditingTags(todo.tags ? todo.tags.join(",") : "");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingText("");
        setEditingList(null);
        setEditingDueDate(null);
        setEditingTags("");
    };

    const saveEdit = () => {
        const tagsArray = editingTags.split(",").map(t => t.trim()).filter(t => t !== "");
        api.put(`/todos/${editingId}`, {
            text: editingText,
            list_id: editingList,
            due_date: editingDueDate,
            tags: tagsArray,
        }).then(res => {
            setTodos(todos.map(todo => (todo.id === editingId ? res.data : todo)));
            cancelEditing();
            fetchTodos();
        }).catch(console.error);
    };

    const updateTodoStatus = (id, status) => {
        api.put(`/todos/${id}`, { status })
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

        if (activeScreen === "Inbox") {
            filtered = filtered.filter(todo => !todo.due_date);
        } else if (activeScreen === "Today") {
            filtered = filtered.filter(todo => {
                if (!todo.due_date) return false;
                const due = new Date(todo.due_date);
                due.setHours(0,0,0,0);
                return due <= today;
            });
        } else if (activeScreen === "Upcoming") {
            filtered = filtered.filter(todo => {
                if (!todo.due_date) return false;
                const due = new Date(todo.due_date);
                due.setHours(0,0,0,0);
                return due > today;
            });
        }

        setFilteredTodos(filtered);
    }, [todos, statusFilter, selectedTagFilter, searchTerm, activeScreen]);

    const completedToday = todos.filter(todo => {
        if (todo.status !== "Completed" || !todo.due_date) return false;
        const due = new Date(todo.due_date);
        const today = new Date();
        return due.toDateString() === today.toDateString();
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
                <Form.Group controlId="tagFilter" className="d-flex align-items-center ms-2">
                    <Form.Label className="me-2 mb-0">Etiket:</Form.Label>
                    <Form.Select
                        value={selectedTagFilter}
                        onChange={e => setSelectedTagFilter(e.target.value)}
                    >
                        <option value="">Tümü</option>
                        {allTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
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
                <Form.Control
                    placeholder="Etiketler (virgülle ayır)"
                    value={newTodoTags}
                    onChange={e => setNewTodoTags(e.target.value)}
                    style={{ maxWidth: "200px" }}
                />
                <Button onClick={addTodo}>Ekle</Button>
            </Form>

            <div className="mb-3 d-flex gap-2">
                <Button
                    variant={activeScreen === "Inbox" ? "primary" : "outline-primary"}
                    onClick={() => setActiveScreen("Inbox")}
                >
                    Inbox
                </Button>
                <Button
                    variant={activeScreen === "Today" ? "primary" : "outline-primary"}
                    onClick={() => setActiveScreen("Today")}
                >
                    Today
                </Button>
                <Button
                    variant={activeScreen === "Upcoming" ? "primary" : "outline-primary"}
                    onClick={() => setActiveScreen("Upcoming")}
                >
                    Upcoming
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
                        {editingId === todo.id ? (
                            <>
                                <Form.Control
                                    className="me-2"
                                    value={editingText}
                                    onChange={e => setEditingText(e.target.value)}
                                    style={{ maxWidth: "60%" }}
                                />
                                <Form.Control
                                    type="date"
                                    className="me-2"
                                    value={editingDueDate || ""}
                                    onChange={e => setEditingDueDate(e.target.value)}
                                    style={{ maxWidth: "160px" }}
                                />
                                <Form.Control
                                    placeholder="Etiketler (virgülle ayır)"
                                    value={editingTags}
                                    onChange={e => setEditingTags(e.target.value)}
                                    style={{ maxWidth: "200px" }}
                                />
                                <Form.Select
                                    value={editingList ? String(editingList) : ""}
                                    onChange={e => setEditingList(e.target.value)}
                                    style={{ maxWidth: "30%" }}
                                >
                                    {lists.map(list => (
                                        <option key={list.id} value={String(list.id)}>{list.name}</option>
                                    ))}
                                </Form.Select>
                                <Button variant="success" size="sm" className="ms-2" onClick={saveEdit}>Kaydet</Button>
                                <Button variant="secondary" size="sm" className="ms-2" onClick={cancelEditing}>İptal</Button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <strong>{todo.text}</strong>{" "}
                                    <Badge bg={todo.status === "Completed" ? "success" : "warning"}>
                                        {todo.status}
                                    </Badge>
                                    {todo.tags && todo.tags.length > 0 && (
                                        <span className="ms-2">
                                            {todo.tags.map((tag, i) => (
                                            <Badge key={i} bg="info" className="me-1">{tag}</Badge>
                                            ))}
                                        </span>
                                    )}
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
                                        variant="outline-primary"
                                        className="me-2"
                                        onClick={() => startEditing(todo)}
                                    >
                                        Düzenle
                                    </Button>
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
                        )}
                    </ListGroup.Item>
                ))}
            </ListGroup>
            )}

        </>
    );
}

export default Todos;
