import React, { useState } from "react";
import List from "./components/List";
import Todos from "./components/Todos";

import { Container, Row, Col } from "react-bootstrap";

function App() {
    const [selectedList, setSelectedList] = useState(null);

    return (
        <Container fluid className="p-3" style={{ height: "100vh" }}>
            <Row className="h-100">
                <Col md={4} className="border-end overflow-auto">
                    <List
                        selectedList={selectedList}
                        onSelectList={setSelectedList}
                    />
                </Col>
                <Col md={8} className="overflow-auto">
                    <Todos selectedList={selectedList} />
                </Col>
            </Row>
        </Container>
    );
}

export default App;
