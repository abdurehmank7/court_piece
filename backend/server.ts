import { Socket, Server } from "socket.io";
import express from "express";
import http from "http";
import cors from "cors";

import Game from "./game";

import {
    ClientMap,
    ClientToServerEvents,
    InterServerEvents,
    ServerToClientEvents,
    SocketData,
} from "../types";

import { v4 as uuid } from "uuid";

const app = express();

app.use(cors());

const server = http.createServer(app);
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});

server.listen(3001, () => {
    console.log("SERVER IS LISTENING ON PORT 3001");
});

// const gameState:{

// }

const clients: ClientMap = {};
let numberOfPlayers: number = 0;

const MapLength = (map: ClientMap): number => {
    let length = 0;
    for (const key in map) {
        length++;
    }
    return length;
};

const allPlayersReady = (): boolean => {
    for (const clientId in clients) {
        if (
            !clients[clientId].name ||
            clients[clientId].name === "" ||
            clients[clientId].name === "null" ||
            clients[clientId].name === "undefined" ||
            clients[clientId].connected === false
        ) {
            return false;
        }
    }
    return true;
};
const TeenPatti = new Game();

const log = () => {
    console.clear();
    console.table(clients);
};

io.on("connection", (socket) => {
    let clientId = socket.handshake.query.clientId as string;
    let name = socket.handshake.query.name as string | undefined;
    // console.log("getClientId event received", clientId, socket.id);
    //handle Client ID
    if (clientId && clients[clientId]) {
        // Update socket ID for existing client
        clients[clientId] = {
            ...clients[clientId],
            socketId: socket.id,
            name: name,
            connected: true,
        };
        socket.data.clientId = clientId;
        socket.data.connected = true;

        //if the game has already started, and the player is a part of the game, then update the player's socket and send the game state
        if (TeenPatti.gameStarted) {
            TeenPatti.updatePlayerAfterDisconnect(clientId, io, socket.id);
        }
    } else {
        const newClientId = uuid();
        clients[newClientId] = {
            socketId: socket.id,
            name: name,
            connected: true,
        };
        socket.data.clientId = newClientId;
        socket.data.connected = true;
        socket.emit("assignClientId", newClientId);
    }

    //LOGGING
    log();
    //LOGGING END

    socket.on("setName", (name, ack) => {
        if (!socket.data.clientId) return;
        try {
            clients[socket.data.clientId] = {
                ...clients[socket.data.clientId],
                name,
            };
            console.log(name, "has joined the game");

            ack(name);
            log();
        } catch (e) {
            console.log("error in setting name");
        }
    });
    //pregame events
    socket.on("numberOfPlayers", (ack) => {
        if (!socket.data.clientId) return;
        numberOfPlayers = MapLength(clients);
        ack(numberOfPlayers);
    });

    socket.on("playerReady", (ack) => {
        if (!socket.data.clientId) return;

        ack();
        if (MapLength(clients) >= 4)
            if (allPlayersReady()) {
                console.log("all players are ready");
                // socket.emit("startGame");
                io.sockets.emit("startGame");
                TeenPatti.startGame(clients, io);
            }
    });

    socket.on("disconnect", () => {
        console.log("user disconnected with a socket id", socket.id);
        if (!socket.data.clientId) return;
        //delete clients[socket.data.clientId];
        clients[socket.data.clientId].connected = false;
        numberOfPlayers = MapLength(clients);
        console.log("numberOfPlayers", numberOfPlayers);
        socket.data.numberOfPlayers = numberOfPlayers;
        socket.data.connected = false;
        log();
    });

    //begin game events, by navigating to every client to start the game

    //HandleGameEvents
    socket.on("test", (message) => {
        console.log("test event received", message);
        socket.emit("test", message + " back");
    });
    socket.on("testAck", (message, ack) => {
        console.log("testAck event received", message);

        if (!socket.data.clientId)
            return ack(
                message + " back undefined",
                "undefined",
                socket.id,
                "undefined"
            );

        let name = clients[socket.data.clientId].name;

        ack(
            message + " back",
            clients[socket.data.clientId].name || "No Name",
            socket.id,
            socket.data.clientId
        );
    });
});
