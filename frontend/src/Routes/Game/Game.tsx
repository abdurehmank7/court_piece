import { Socket } from "socket.io-client";
import {
    ClientToServerEvents,
    ServerToClientEvents,
    gameStateInterface,
} from "../../../../types";
import { useEffect, useState } from "react";
import CardHolder from "../../components/Card/CardHolder";
import Card from "../../components/Card/Card";
import { FaceDownCard } from "../../components/Card/Card";

type Props = {
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
};

export default function Game({ socket }: Props) {
    const [gameState, setGameState] = useState<gameStateInterface | null>(null);
    const [isTurn, setIsTurn] = useState<boolean>(false);
    const [messages, setMessages] = useState<string[]>([]);

    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | null>(null);

    useEffect(() => {
        socket.on(
            "updateUniquePlayerGameState",
            (updatedGameState: gameStateInterface) => {
                setGameState(updatedGameState);
                if (updatedGameState.turn === updatedGameState.selfId) {
                    setIsTurn(true);
                }
                console.log(updatedGameState);
            }
        );

        socket.on("message", (message: string) => {
            console.log(message);
            setMessages(
                //we get new messages, but due to being in strict mode, we need to filter the same messages
                (messages) => {
                    if (messages.includes(message)) return messages;
                    return [...messages, message];
                }
            );
        });

        socket.on("gameOver", (winner: string) => {
            //stop the game
            setGameOver(true);
            setWinner(winner);
        });
    }, [socket, gameState]);

    // useEffect(() => {
    //     //if game is over, then we need to stop the game
    //     if (gameOver) {
    //         socket.emit("leaveGame");
    //         return;
    //     }
    // }, [gameState]);

    //do we have a possible move?
    // useEffect(() => {
    //     if (gameState && gameState.selfId === gameState.turn) {
    //         if (gameState.playingPile.length === 0) return;
    //         gameState.players
    //             .find((player) => player.playerId === gameState.selfId)
    //             ?.handCards?.forEach((card) => {
    //                 setMovePossible(
    //                     isValidMove(
    //                         card.value,
    //                         gameState.playingPile[
    //                             gameState.playingPile.length - 1
    //                         ].value,
    //                         gameState.playingPile[
    //                             gameState.playingPile.length - 1
    //                         ].value === 7
    //                     )
    //                 );
    //             });
    //     }
    // }, [gameState]);

    // useEffect(() => {
    //     if (!movePossible && gameState && gameState.selfId === gameState.turn) {
    //         socket.emit("pickupCards", (possible) => {
    //             console.log(possible);
    //             //reset movePossible
    //             setMovePossible(true);
    //         });
    //     }
    // }, [movePossible, gameState, socket]);

    return (
        <>
            {!gameOver ? (
                <div>
                    {gameState ? (
                        <div
                            className={`w-full h-full flex flex-row justify-center items-center`}
                        >
                            <GameDisplay
                                gameState={gameState}
                                socket={socket}
                            />
                            <div className="flex flex-col w-1/4 h-full pt-5 overflow-x-hidden overflow-y-scroll border border-orange-500 scroll-smooth whitespace-break-spaces">
                                {messages.map((message, index) => (
                                    <div>
                                        <p className="text-white">{message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="animate-pulse">
                                Waiting for other players to join
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <p>Game Over</p>
                    <p>{winner} won the game</p>

                    <button
                        onClick={() => {
                            socket.emit("leaveGame");

                            //redirect to home
                            window.location.href = "/";
                        }}
                    >
                        Leave Game
                    </button>
                </div>
            )}
        </>
    );
}

// function isValidMove(value: number, lastValue: number, nextTurnLower: boolean) {
//     if (value === 2 || value === 7 || value === 8 || value === 10) return true;
//     if (nextTurnLower) {
//         return value < lastValue;
//     } else {
//         return value > lastValue;
//     }
// }

function GameDisplay({
    gameState,
    socket,
}: {
    gameState: gameStateInterface;
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}) {
    const getSelfPlayer = (gameState: gameStateInterface) => {
        for (let i = 0; i < gameState.players.length; i++) {
            if (
                gameState.players[i].playerId ===
                sessionStorage.getItem("clientId")
            ) {
                return gameState.players[i];
            }
        }
    };

    const getSelfPlayerIndex = (gameSt1ate: gameStateInterface) => {
        for (let i = 0; i < gameState.players.length; i++) {
            if (
                gameState.players[i].playerId ===
                sessionStorage.getItem("clientId")
            ) {
                return i;
            }
        }
    };

    const otherPlayerIndexes = (gameState: gameStateInterface): number[] => {
        const selfPlayerIndex = getSelfPlayerIndex(gameState);
        const otherPlayerIndexes: number[] = [];
        for (let i = 0; i < gameState.players.length; i++) {
            if (i !== selfPlayerIndex) {
                otherPlayerIndexes.push(i);
            }
        }
        return otherPlayerIndexes;
    };

    return (
        <div className="relative flex items-center justify-center w-3/4 h-full overflow-hidden border border-orange-500">
            <div className="absolute -bottom-10 left-[calc(50%-12rem)]">
                <PlayerDisplay
                    player={getSelfPlayer(gameState)!}
                    turnId={gameState.turn}
                    socket={socket}
                />
            </div>
            {[
                "absolute -left-[8rem] top-[calc(50%-7.5rem)] rotate-90",
                "absolute -top-[3rem] left-[calc(50%-12rem)] rotate-180",
                "absolute -right-[8rem] top-[calc(50%-7.5rem)] -rotate-90",
            ].map((style, i) => {
                return (
                    <div className={style} key={i}>
                        <PlayerDisplay
                            player={
                                gameState.players[
                                    otherPlayerIndexes(gameState)[i]
                                ]
                            }
                            turnId={gameState.turn}
                            socket={socket}
                        />
                    </div>
                );
            })}

            <CardHolder className="-space-x-10">
                {gameState.playingPile.map((card) => {
                    return (
                        <Card key={(card.suit + 1) * card.value} Card={card} />
                    );
                })}
            </CardHolder>

            <CardHolder className="flex-col -space-y-[5.5rem] absolute right-[15rem]">
                {Array(gameState.drawPileSize)
                    .fill(0)
                    .map((_, i) => {
                        return <FaceDownCard key={i} />;
                    })}
            </CardHolder>

            <button
                className="absolute p-2 transition-all duration-200 bg-red-500 rounded-md bottom-5 right-5 hover:bg-red-600 hover:scale-95 active:bg-red-700"
                onClick={() => {
                    socket.emit("pickupCards", (possible) => {
                        console.log(possible);
                    });
                }}
                type="button"
            >
                Pick Up
            </button>
        </div>
    );
}

function PlayerDisplay({
    player,
    turnId,
    socket,
}: {
    player: gameStateInterface["players"][0];
    turnId: string;
    // submitCardEvent?: (
    //     socket: Socket<ServerToClientEvents, ClientToServerEvents>
    // ) => void;
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}) {
    return (
        <div className="relative h-52 w-96">
            <p
                className={`mb-4 text-center ${
                    player.playerId === turnId && "text-yellow-400 font-bold"
                }`}
            >
                Player: {player.name}
            </p>

            {/* Hand Cards, playable cards */}
            <CardHolder
                className={`absolute z-10 max-w-lg -space-x-8 w-fit -bottom-5 transition-all duration-200 ${
                    player.playerId === turnId && "scale-150 -translate-y-10"
                }`}
            >
                {player.handCards!.map((card) => {
                    return (
                        <Card
                            key={(card.suit + 2) * card.value}
                            Card={card}
                            disabled={!(player.playerId === turnId)}
                            onclick={() => {
                                // if (player.playerId === turnId) {
                                console.log(
                                    "Submitting Card: ",
                                    card.suit,
                                    card.value
                                );
                                console.log(socket.id);
                                socket.emit("playCard", card, (possible) => {
                                    if (possible) {
                                        console.log("Card Played");
                                    } else {
                                        console.log("Card Not Played");
                                    }
                                    //if we have no power cards
                                    //if the last card in the playing pile is 7 and we have all cards higher than it, we need to ask the server for all the cards in the playing pile
                                    //if the last card in the playing pile is not 7, and we have all cards smaller than that, we need to ask the server for all the cards

                                    //if we have power cards
                                });
                                // }
                            }}
                        />
                    );
                })}
            </CardHolder>

            {/* faceUpCards with faceDown Cards */}
            <CardHolder className="justify-center -space-x-8">
                {Array(player.faceDownCards)
                    .fill(0)
                    .map((_, index) => {
                        return <FaceDownCard key={index} />;
                    })}
                {player.faceUpCards.map((card) => {
                    return (
                        <Card
                            key={(card.suit + 1) * card.value}
                            Card={card}
                            disabled
                        />
                    );
                })}
            </CardHolder>
        </div>
    );
}
