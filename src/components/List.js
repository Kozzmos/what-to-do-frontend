import React, { useEffect, useState } from "react";
import api from "../api";
import { Form, Button, ListGroup, Badge, CloseButton, Spinner } from "react-bootstrap";
import { supabase } from "./supabaseClient";

function List({ selectedList, onSelectList }) {
    const [lists, setLists] = useState([]);
    const [newListName, setNewListName] = useState("");
    const [newListColor, setNewListColor] = useState("#2196f3"); // default mavi
    const [newListTags, setNewListTags] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingColor, setEditingColor] = useState("#000000");
    const [editingTags, setEditingTags] = useState("");
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        async function fetchUser() {
            const {data, error } = await supabase.auth.getUser();
            if (data?.user){
                setUserId(data.user.id);
            }
        }
        fetchUser();
    }, []);

    useEffect(() => {
        if(userId){
            fetchLists();
        }
    }, [userId]);

    const fetchLists = () => {
        console.log("fetchLists userId:", userId);
        setLoading(true);
        api.get("/lists", {
            params: { user_id: userId }
        })
            .then(res => {
                setLists(res.data);
                setLoading(false);
                if (!selectedList && res.data.length > 0) {
                    onSelectList(res.data[0]);
                }
            })
            .catch(() => setLoading(false));
    };

    const handleAddList = (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        const tagsArray = newListTags
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0);

        api.post("/lists", {
            name: newListName,
            tags: tagsArray,
            color: newListColor,
            user_id: userId
        })
            .then(res => {
                setLists([...lists, res.data]);
                setNewListName("");
                setNewListTags("");
                setNewListColor("#2196f3");
                onSelectList(res.data);
            })
            .catch(console.error);
    };

    const handleDeleteList = (id) => {
        if (!window.confirm("Bu listeyi silmek istediğine emin misin?")) return;

        api.delete(`/lists/${id}`)
            .then(() => {
                setLists(lists.filter(l => l.id !== id));
                if (selectedList?.id === id) onSelectList(null);
            })
            .catch(console.error);
    };

    const filteredLists = lists.filter(list =>
        list.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startEditing = (list) => {
        setEditingId(list.id);
        setEditingName(list.name);
        setEditingColor(list.color || "#000000");
        setEditingTags(list.tags ? list.tags.join(",") : "");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName("");
        setEditingColor("#000000");
        setEditingTags("");
    };

    const saveEdit = (id) => {
        const tagsArray = editingTags.split(",").map(t => t.trim()).filter(t => t !== "");

        api.put(`/lists/${id}`, {
            name: editingName,
            color: editingColor,
            tags: tagsArray,
        })
            .then(res => {
                setLists(lists.map(l => (l.id === id ? res.data : l)));
                if(selectedList?.id === id) onSelectList(res.data); // seçili listeyi güncelle
                cancelEditing();
            })
            .catch(console.error);
    };

    return (
        <>
            <h2>Listeler</h2>
            <Form.Group className="mb-3">
                <Form.Control
                    type="search"
                    placeholder="Liste ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </Form.Group>

            {loading && <div className="text-center"><Spinner animation="border" /></div>}

            <ListGroup>
                {filteredLists.map(list => (
                    <ListGroup.Item
                        key={list.id}
                        active={selectedList?.id === list.id}
                        onClick={() => onSelectList(list)}
                        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                        {editingId === list.id ? (
                            <>
                                <Form.Control
                                    type="text"
                                    value={editingName}
                                    onChange={e => setEditingName(e.target.value)}
                                    style={{ maxWidth: '40%' }}
                                />
                                <Form.Control
                                    type="color"
                                    value={editingColor}
                                    onChange={e => setEditingColor(e.target.value)}
                                    style={{ width: 50, height: 35, marginLeft: 10 }}
                                />
                                <Form.Control
                                    type="text"
                                    value={editingTags}
                                    onChange={e => setEditingTags(e.target.value)}
                                    placeholder="Tagleri virgülle ayır"
                                    style={{ maxWidth: '30%', marginLeft: 10 }}
                                />
                                <Button variant="success" size="sm" className="ms-2" onClick={() => saveEdit(list.id)}>Kaydet</Button>
                                <Button variant="secondary" size="sm" className="ms-2" onClick={cancelEditing}>İptal</Button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <div
                                        style={{
                                            backgroundColor: list.color,
                                            width: 20,
                                            height: 20,
                                            borderRadius: 4,
                                            display: "inline-block",
                                            marginRight: 10,
                                        }}
                                    ></div>


                                    {list.name}
                                    {list.tags && list.tags.length > 0 && (
                                        <>
                                            {" "}
                                            {list.tags.map((tag, i) => (
                                                <Badge key={i} bg="info" className="ms-1">{tag}</Badge>
                                            ))}
                                        </>
                                    )}
                                </div>
                                <div>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); startEditing(list); }}
                                        className="me-2"
                                    >
                                        Düzenle
                                    </Button>
                                    <CloseButton onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }} />
                                </div>
                            </>
                        )}
                    </ListGroup.Item>
                ))}
            </ListGroup>

            {/* Yeni liste formu */}
            <h5>Yeni Liste Oluştur </h5>
            <Form onSubmit={handleAddList} className="mt-3">
                <Form.Group className="mb-2">
                    <Form.Control
                        placeholder="Yeni liste adı..."
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="mb-2 d-flex gap-2 align-items-center">
                    <Form.Label className="mb-0" style={{ whiteSpace: "nowrap" }}>
                        Renk:
                    </Form.Label>
                    <Form.Control
                        type="color"
                        value={newListColor}
                        onChange={e => setNewListColor(e.target.value)}
                        style={{ width: "50px", padding: 0, border: "none" }}
                    />

                    <Form.Control
                        type="text"
                        placeholder="Etiketler (virgülle ayır)"
                        value={newListTags}
                        onChange={e => setNewListTags(e.target.value)}
                        className="flex-grow-1"
                    />
                </Form.Group>

                <Button type="submit" className="w-100">Ekle</Button>
            </Form>
        </>
    );
}

export default List;
