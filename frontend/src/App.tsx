import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../../types";

import TestPage from "./Routes/Test/TestPage";
import Home from "./Routes/Home/Home";
import Layout from "./components/Layout/Layout";
import { useEffect, useState } from "react";
import Game from "./Routes/Game/Game";

function App() {
    const [socket, setSocket] = useState<Socket<
        ServerToClientEvents,
        ClientToServerEvents
    > | null>(null);

    useEffect(() => {
        const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> =
            io("http://localhost:3001", {
                transports: ["websocket"],
                query: {
                    clientId: sessionStorage.getItem("clientId") || "newClient",
                    name: sessionStorage.getItem("name"),
                },
            });
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        // socket.on("getClientId", (ack) => {
        //     ack(sessionStorage.getItem("clientId") || "newClient");
        // });

        // let clientId = sessionStorage.getItem("clientId");

        // socket.emit("clientId", clientId);

        socket.on("assignClientId", (assignedClientId: string) => {
            sessionStorage.setItem("clientId", assignedClientId);
            // sessionStorage.setItem("name", name);
        });

        return () => {
            socket.off("assignClientId");
        };
    }, [socket]);

    return (
        <Layout>
            {socket ? (
                <Router>
                    <Routes>
                        <Route path="/" element={<Home socket={socket} />} />
                        {/* <Route
                            path="/game"
                            element={<Game socket={socket} />}
                        /> */}
                        <Route
                            path="/test"
                            element={<TestPage socket={socket} />}
                        />
                    </Routes>
                </Router>
            ) : (
                <div className="flex flex-col items-center justify-center h-screen">
                    <h1>Loading...</h1>
                </div>
            )}
        </Layout>
    );
}

export default App;
