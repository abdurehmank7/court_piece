import { Card } from "./backend/game";

export interface gameStateInterface {
    selfId: string;
    selfName: string;
    discardPile: Card[];
    playingPile: Card[];
    drawPileSize: number;
    turn: playerId;
    gameOver: boolean;
    players: {
        playerId: string;
        name: string;
        faceUpCards: Card[];
        faceDownCards: Card[] | number;
        handCards: Card[] | null;
    }[];
}

export interface ClientMap {
    [clientId: string]: {
        socketId: string;
        name?: string;
        connected: boolean;
    };
}

export type ServerToClientEvents = {
    test: (message: string) => void;
    assignClientId: (clientId: string) => void;
    getClientId: (ack: (clientId: string | null) => void) => void;

    //game events
    cards: (
        faceUpCards: Card[],
        numberOfFaceDownCards: number,
        handCards: Card[]
    ) => void;
    updateUniquePlayerGameState: (gameState: gameStateInterface) => void;

    //gameEnd events
    gameOver: (winner: string) => void;

    //errors
    error: (message: string) => void;

    //message
    message: (message: string) => void;

    //begin Game Evet
    startGame: () => void;
};

export type ClientToServerEvents = {
    test: (message: string) => void;
    clientId: (clientId: string | null) => void;
    setName: (name: string, ack: (name: string) => void) => void;

    //pregame events
    playerReady: (ack: () => void) => void;
    numberOfPlayers: (ack: (numberOfPlayers: number) => void) => void;

    //game events
    playCard: (card: Card, ack: (possible: boolean) => void) => void;
    pickupCards: (ack: (possible: boolean) => void) => void;

    //game end events
    leaveGame: () => void;

    //test with ack
    testAck: (
        message: string,
        ack: (
            message: string,
            name: string,
            socketId: string,
            clientId: string
        ) => void
    ) => void;
};

export type InterServerEvents = {
    ping: () => void;
};

export type SocketData = {
    clientId: string | null;
    numberOfPlayers: number;
    connected: boolean;
};

export type TeenSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
