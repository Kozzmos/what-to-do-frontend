import React, { useEffect, useState } from "react";
import api from "../api";
import { Form, Button, ListGroup, Badge, Spinner } from "react-bootstrap";

function Todos({ selectedList }) {
    const [todos, setTodos] = useState([]);
    const [filteredTodos, setFilteredTodos] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [newTodoText, setNewTodoText] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [editingList, setEditingList] = useState(null);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLists();
    }, []);

    useEffect(() => {
        fetchTodos();
    }, [selectedList]);

    const fetchLists = () => {
        api.get("/lists")
            .then(res => setLists(res.data))
            .catch(console.error);
    };

    const fetchTodos = () => {
        setLoading(true);
        if (!selectedList || selectedList === "all") {
            api.get("/todos")
                .then(res => {
                    setTodos(res.data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            api.get(`/todos?listId=${selectedList.id}`)
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
        api.post("/todos", {
            list_id: selectedList?.id || null,
            text: newTodoText,
            status: "New",
            active: true,
        }).then(res => {
            setTodos([...todos, res.data]);
            setNewTodoText("");
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
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingText("");
        setEditingList(null);
    };

    const saveEdit = () => {
        api.put(`/todos/${editingId}`, {
            text: editingText,
            list_id: editingList,
        }).then(res => {
            setTodos(todos.map(todo => (todo.id === editingId ? res.data : todo)));
            cancelEditing();
        }).catch(console.error);
    };

    const updateTodoStatus = (id, status) => {
        api.put(`/todos/${id}`, { status })
            .then(res => {
                setTodos(todos.map(todo => (todo.id === id ? res.data : todo)));
            })
            .catch(console.error);
    };

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
            </Form>

            <Form className="mb-3 d-flex gap-2">
                <Form.Control
                    placeholder="Yeni yapılacak..."
                    value={newTodoText}
                    onChange={e => setNewTodoText(e.target.value)}
                />
                <Button onClick={addTodo}>Ekle</Button>
            </Form>

            {loading && <div className="text-center"><Spinner animation="border" /></div>}

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
                                <Form.Select
                                    value={editingList || ""}
                                    onChange={e => setEditingList(e.target.value || null)}
                                    style={{ maxWidth: "30%" }}
                                >
                                    <option value="">Tümü</option>
                                    {lists.map(list => (
                                        <option key={list.id} value={list.id}>{list.name}</option>
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
        </>
    );
}

export default Todos;
