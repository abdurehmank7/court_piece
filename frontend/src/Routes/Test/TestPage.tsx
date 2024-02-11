import { useState } from "react";
import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../../../../types";

//create an interface for the props that you want to pass to this component
interface HomePageProps {
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
    //you can always add more functions/objects that you would like as props for this component
}

function TestPage({ socket }: HomePageProps) {
    const [gameState, setGameState] = useState<{
        message: string;
        name: string;
        socketId: string;
        clientId: string;
    }>({
        message: "",
        name: "",
        socketId: "",
        clientId: "",
    });
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1>Welcome to Teen Patti</h1>
            <br />
            <br />
            <div className="flex flex-col items-center justify-center">
                <div className="space-x-2">
                    <h1>Socket Test</h1>
                    <h5>Name: {gameState.name}</h5>
                    <h5>Socket Id: {gameState.socketId}</h5>
                    <h5>Client Id: {gameState.clientId}</h5>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            console.log("Socket ID: ", socket.id);

                            // socket.emit("testAck", message, () => {
                            // });

                            socket.emit(
                                "setName",
                                gameState.message,
                                (name: string) => {
                                    console.log(name);
                                }
                            );

                            socket.emit(
                                "testAck",
                                gameState.message,
                                (
                                    message: string,
                                    name: string,
                                    socketId: string,
                                    clientId: string
                                ) => {
                                    console.log(
                                        message,
                                        name,
                                        socketId,
                                        clientId
                                    );

                                    setGameState({
                                        message,
                                        name,
                                        socketId,
                                        clientId,
                                    });
                                }
                            );
                        }}
                    >
                        <input
                            className="p-2 border border-black rounded-lg"
                            type="text"
                            value={gameState.message}
                            onChange={(e) => {
                                setGameState({
                                    ...gameState,
                                    message: e.target.value,
                                });
                            }}
                        />
                        <button
                            className="p-2 border border-black rounded-lg"
                            type="submit"
                        >
                            Click Me
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
export default TestPage;
