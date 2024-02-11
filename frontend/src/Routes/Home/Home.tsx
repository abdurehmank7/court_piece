import React, { useEffect } from "react";
import { ClientToServerEvents, ServerToClientEvents } from "../../../../types";
import { Socket } from "socket.io-client";
import Game from "../Game/Game";

type Props = {
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
};

export default function Home({ socket }: Props) {
    const [waiting, setWaiting] = React.useState<boolean>(false);
    const [ready, setReady] = React.useState<boolean>(false);
    const [name, setName] = React.useState<string>(
        sessionStorage.getItem("name") || ""
    );

    const [game, setGame] = React.useState<boolean>(false);

    const [numbersOfPlayers, setNumbersOfPlayers] = React.useState<number>(0);

    useEffect(() => {
        let interval = setInterval(() => {
            socket.emit("numberOfPlayers", (numberOfPlayers: number) => {
                setNumbersOfPlayers(numberOfPlayers);
            });
        }, 2000);

        if (game) clearInterval(interval);

        return () => {
            clearInterval(interval);
        };
        //clear interval on unmount or when the the game begins
    }, [socket, game]);

    useEffect(() => {
        socket.on("startGame", () => {
            // sessionStorage.setItem("game", "true");
            setGame(true);
        });
    }, [socket]);

    return (
        <>
            {!game && (
                <div className="flex flex-col items-center justify-center h-screen">
                    <h1 className="text-xl font-bold">Welcome To Teen Patti</h1>
                    <br />
                    <h2 className="text-lg">
                        There {numbersOfPlayers === 1 ? "is" : "are"}{" "}
                        <span className="font-bold">
                            {numbersOfPlayers === 0 ? "no" : numbersOfPlayers}{" "}
                            {numbersOfPlayers === 1 ? "player" : "players"}
                        </span>{" "}
                        in the waiting room
                    </h2>
                    <p className="text-sm">
                        once there are 4 players you shall be able to join
                    </p>
                    <br />
                    <form
                        className="flex flex-row items-center justify-center space-x-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            socket.emit("setName", name, (name: string) => {
                                if (name) {
                                    sessionStorage.setItem("name", name);
                                    setWaiting(true);
                                    socket.emit("playerReady", () => {
                                        setReady(true);
                                    });
                                }
                            });
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Enter your name"
                            className="px-4 py-2 text-black border border-black rounded-md"
                            value={name}
                            disabled={waiting || ready}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={waiting || ready}
                            className="px-4 py-2 transition-all duration-300 bg-green-400 border border-black rounded-md cursor-pointer hover:bg-green-200 active:scale-95 disabled:bg-green-600 disabled:text-white disabled:cursor-not-allowed"
                        >
                            {!ready ? "Join Game" : "Ready"}
                        </button>
                    </form>
                    <br />
                    <br />
                    <button
                        type="button"
                        className={`px-4 py-2 transition-all duration-300 bg-green-300 border border-black rounded-md cursor-pointer hover:bg-green-200 active:scale-95 disabled:bg-red-600 disabled:text-white

                ${
                    waiting || ready
                        ? "animate-pulse !bg-yellow-500"
                        : "disabled animate-pulse"
                }

                `}
                        onClick={() => {
                            console.log("clicked");
                        }}
                        disabled
                    >
                        {!ready
                            ? "Waiting for you to join"
                            : waiting
                            ? "Waiting for other players to join"
                            : "Join Game"}
                    </button>
                </div>
            )}

            {game && <Game socket={socket} />}
        </>
    );
}
