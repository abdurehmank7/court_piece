import { Server, Socket } from "socket.io";
import {
    ClientMap,
    ClientToServerEvents,
    InterServerEvents,
    ServerToClientEvents,
    SocketData,
} from "../types";

export enum Suit {
    Diamond,
    Club,
    Heart,
    Spade,
}

export class Card {
    suit: Suit;
    value: number;

    constructor(suit: number, value: number) {
        this.suit = suit;
        this.value = value;
    }

    static CardToString(card: Card) {
        let suit = "";
        let value = "";
        switch (card.suit) {
            case Suit.Spade:
                suit = "Spade";
                break;
            case Suit.Heart:
                suit = "Heart";
                break;
            case Suit.Diamond:
                suit = "Diamond";
                break;
            case Suit.Club:
                suit = "Club";
                break;
        }
        switch (card.value) {
            case 11:
                value = "Jack";
                break;
            case 12:
                value = "Queen";
                break;
            case 13:
                value = "King";
                break;
            case 14:
                value = "Ace";
                break;
            default:
                value = card.value.toString();
                break;
        }

        return `${value} of ${suit}`;
    }
}

export class Deck {
    cards: Card[];
    size: number;
    constructor() {
        this.size = 52;
        this.cards = Array(52)
            .fill(0)
            .map((_, i) => new Card(Math.floor(i / 13), (i % 13) + 2));
        // this.shuffle();

        //check if all are unique
        const set = new Set(this.cards);
        if (set.size !== this.cards.length) {
            throw new Error("Duplicate cards");
        }
    }

    shuffle() {
        for (let i = 0; i < 100; i++) {
            const index1 = Math.floor(Math.random() * this.size);
            const index2 = Math.floor(Math.random() * this.size);
            const temp = this.cards[index1];
            this.cards[index1] = this.cards[index2];
            this.cards[index2] = temp;
        }
        console.log("deck shuffled", this.cards.length);
    }

    pop(): Card | undefined {
        if (this.cards.length === 0) return undefined;
        this.size = this.cards.length - 1;
        return this.cards.pop();
    }

    push(card: Card) {
        this.size = this.cards.length + 1;
        this.cards.push(card);
    }
}

class Player {
    playerId: string;
    playerSocketId: string;
    playerSocket:
        | Socket<ClientToServerEvents, ServerToClientEvents>
        | undefined;
    name: string;

    faceUpCards: Card[];
    faceDownCards: Card[];
    handCards: Card[];

    constructor(
        name: string,
        playerId: string,
        playerSocketId: string,
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >
    ) {
        this.playerId = playerId;
        this.playerSocketId = playerSocketId;
        this.name = name;
        this.faceUpCards = [];
        this.faceDownCards = [];
        this.handCards = [];
        this.playerSocket = io.sockets.sockets.get(playerSocketId);
    }

    updatePlayerSocket(
        Socket: Socket<ClientToServerEvents, ServerToClientEvents>
    ) {
        this.playerSocket = Socket;
    }
}

class TeenPatti {
    gameStarted: boolean = false;
    numberOfPlayers = 4;
    deck: Deck;
    discardPile: Card[] = [];
    playingPile: Card[] = [];
    //4 players
    players: Player[];
    turnId: string;
    turnIndex: number;
    nextTurnLower: boolean;
    gameOver: boolean;

    constructor() {
        //save the socket
        // this.socket = socket;

        //create a deck
        this.deck = new Deck();

        //create 4 players
        this.players = [];
        this.turnId = "";
        this.turnIndex = -1;
        this.nextTurnLower = false;
        this.gameOver = false;
    }

    startGame(
        clients: ClientMap,
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >
    ) {
        //from the map we will extract the clients and then make them players
        for (const clientId in clients) {
            if (
                !clients[clientId].name ||
                clients[clientId].name === "" ||
                clients[clientId].name === "null" ||
                clients[clientId].name === "undefined" ||
                clients[clientId].name === undefined
            ) {
                //throw error
                io.sockets.emit(
                    "error",
                    "Some players have not set their name"
                );
            }
            if (clients[clientId] && clients[clientId].connected) {
                this.players.push(
                    new Player(
                        clients[clientId].name!,
                        clientId,
                        clients[clientId].socketId,
                        io
                    )
                );
            }
        }
        this.gameStarted = true;
        this.turnIndex = 0;
        this.turnId = this.players[0].playerId;
        this.deck.shuffle(); //shuffle the deck
        this.dealCards(); //deal cards to the players
        this.updatePlayersGameState(io);
        this.handleGame(io);
    }

    dealCards() {
        //a player will get 9 cards in total
        //3 face up cards
        //3 face down cards
        //3 hand cards
        this.players.forEach((player) => {
            [1, 2, 3].forEach(() => {
                player.faceUpCards.push(this.deck.pop()!); //pop the card from the deck and push it to the player's face up cards
                player.faceDownCards.push(this.deck.pop()!); //pop the card from the deck and push it to the player's face down cards
                player.handCards.push(this.deck.pop()!); //pop the card from the deck and push it to the player's hand cards
            });
        });
    }

    updatePlayerAfterDisconnect(
        clientId: string,
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >,
        socketId: string
    ) {
        this.players.forEach((player) => {
            if (player.playerId === clientId) {
                console.log("updating player", clientId, socketId, player.name);
                player.updatePlayerSocket(io.sockets.sockets.get(socketId)!);
                player.playerSocket!.emit("startGame");
                // player.playerSocket!.emit(
                //     "cards",
                //     player.faceUpCards,
                //     player.faceDownCards.length,
                //     player.handCards
                // );
                this.updatePlayersGameState(io, player.name + " reconnected");
                this.handleGame(io);
            }
        });
    }

    updatePlayersGameState(
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >,
        message?: string
    ) {
        //everytime we call handleGamePlay, we will check if the game is over
        //if the game is over, we will return

        //if the game is not over, we will check if the game is started
        //if the game is not started, we will return

        //everytime we will update the players, with all the new cards and the new discard pile, and the new playing pile. Update for each player will be specific to that player, as we dont want to show the other players cards to the player, even in states
        console.log("updating players' game state");
        //call UPDATE_PLAYERS
        this.players.forEach((player) => {
            player.playerSocket!.emit("updateUniquePlayerGameState", {
                selfId: player.playerId,
                selfName: player.name,
                discardPile: this.discardPile,
                playingPile: this.playingPile,
                turn: this.turnId,
                drawPileSize: this.deck.cards.length,
                gameOver: this.gameOver,
                players: this.players.map((mapPlayer) => {
                    return {
                        playerId: mapPlayer.playerId,
                        name: mapPlayer.name,
                        faceUpCards: mapPlayer.faceUpCards,
                        faceDownCards: mapPlayer.faceDownCards.length,
                        handCards:
                            mapPlayer.playerId === player.playerId
                                ? mapPlayer.handCards
                                : [],
                    };
                }),
            });
        });
        if (message)
            io.sockets.emit(
                "message",
                new Date(Date.now()).toLocaleTimeString(
                    // HH:MM:SS
                    "en-US",
                    {
                        hour12: false,
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                    }
                ) +
                    ": " +
                    message
            );
    }

    isValidMove(card: Card) {
        if (this.playingPile.length === 0) return true;
        if (
            card.value === 2 ||
            card.value === 7 ||
            card.value === 8 ||
            card.value === 10
        )
            return true;
        const lastCard = this.playingPile[this.playingPile.length - 1];
        if (lastCard.value === card.value) return true;

        if (this.nextTurnLower === true) {
            // this.nextTurnLower = false;
            return card.value < lastCard.value;
        } else {
            return card.value > lastCard.value;
        }
    }

    handleGame(
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >
    ) {
        this.players.forEach((player) => {
            player.playerSocket!.on("playCard", (card: Card, ack: Function) => {
                console.log("playCard", card);
                // check if it is the player's turn
                if (this.turnId !== player.playerId) {
                    //throw error
                    io.sockets.emit("error", "Not your turn");
                    return;
                }
                //check if the card is in the player's hand by matching the value and the suit
                const cardIndex = player.handCards.findIndex(
                    (handCard) =>
                        handCard.value === card.value &&
                        handCard.suit === card.suit
                );
                if (cardIndex === -1) {
                    //throw error
                    io.sockets.emit("error", "Card not found in hand");
                    return;
                }

                //check if the move is valid
                if (!this.isValidMove(card)) {
                    //throw error
                    io.sockets.emit("error", "Invalid move");
                    return;
                }
                ack(this.isValidMove(card));
                //remove the card from the player's hand
                player.handCards.splice(cardIndex, 1);
                //add the card to the playing pile
                this.playingPile.push(card);
                //if there are cards in the deck, add a card to the player's hand
                if (this.deck.cards.length > 0) {
                    player.handCards.push(this.deck.pop()!);
                }

                this.turnIndex = this.turnIndex === 3 ? 0 : this.turnIndex + 1;
                console.log("turn index", this.turnIndex);

                this.nextTurnLower = false;

                //check if a Refresh card was played 2
                if (card.value === 2) {
                    //if a 2 was played, the player will get another turn
                    // the turn will not change
                    this.turnIndex =
                        this.turnIndex === 0 ? 3 : this.turnIndex - 1;
                    console.log("turn index", this.turnIndex);
                }
                //check if a low card was played 7
                else if (card.value === 8) {
                    //nothing happens, just turn changes
                    //if an 8 was played, the next player has to throw a card higher than the 8
                    // the turn will not change
                } else if (card.value === 10) {
                    // burn card
                    //the playing pile will be added to the discard pile
                    this.discardPile.push(...this.playingPile);
                    this.playingPile = [];
                } else if (card.value === 7) {
                    //if a 7 was played, the next player has to throw a card lower than the 7
                    // the turn will not change
                    this.nextTurnLower = true;
                }
                //turnIndex to turnId
                this.turnId = this.players[this.turnIndex].playerId;

                //check if the player has no hand cards left, if so, give them one card from the faceUpCards
                if (player.handCards.length === 0) {
                    //check if the player has faceUpCards
                    if (player.faceUpCards.length > 0) {
                        //give the player a card from the faceUpCards
                        player.handCards.push(player.faceUpCards.pop()!);
                    } else {
                        //check if the player has faceDownCards
                        if (player.faceDownCards.length > 0) {
                            //give the player a card from the faceDownCards
                            player.handCards.push(player.faceDownCards.pop()!);
                        }
                    }

                    //check if the player has no cards left, in hand, faceup and facedown
                    if (
                        player.handCards.length === 0 &&
                        player.faceUpCards.length === 0 &&
                        player.faceDownCards.length === 0
                    ) {
                        // the player has no cards left, the game is over
                        this.gameOver = true;
                        //emit the game over event
                        io.sockets.emit("gameOver", player.name);
                        console.log("game over", player.name, "won");
                    }
                }

                //update the players
                this.updatePlayersGameState(
                    io,
                    Card.CardToString(card) + "s Played by " + player.name
                );
            });

            player.playerSocket!.on("pickupCards", (ack: Function) => {
                console.log("Player: ", player.name, "wants to pick up cards");

                if (this.turnId !== player.playerId) {
                    io.sockets.emit("error", "Not your turn");
                    return;
                }
                if (this.playingPile.length === 0) {
                    io.sockets.emit("error", "No cards to pick up");
                    return;
                }
                ack();
                player.handCards.push(...this.playingPile);
                this.playingPile = [];
                // io.sockets.emit(
                //     "message",
                //     "Player: " + player.name + " picked up cards"
                // );
                // //
                this.updatePlayersGameState(
                    io,
                    player.name + " picked up cards"
                );
                // this.turnIndex = (this.turnIndex + 1) % 4;
                // this.turnId = this.players[this.turnIndex].playerId;
            });

            // player.playerSocket!.on("disconnect", () => {
            //     console.log("user disconnected with a socket id", socket.id);
            //     if (!socket.data.clientId) return;
            //     //delete clients[socket.data.clientId];
            //     clients[socket.data.clientId].connected = false;
            //     numberOfPlayers = MapLength(clients);
            //     console.log("numberOfPlayers", numberOfPlayers);
            //     socket.data.numberOfPlayers = numberOfPlayers;
            //     socket.data.connected = false;
            //     log();
            // });

            //     player.playerSocket!.on("discardCard", (card: Card) => {
            //         console.log("discardCard", card);
            //         //check if the card is in the player's hand
            //         const cardIndex = player.handCards.findIndex(
            //             (handCard) => handCard.value === card.value
            //         );
            //         if (cardIndex === -1) {
            //             //throw error
            //             io.sockets.emit("error", "Card not found in hand");
            //             return;
            //         }
            //         //remove the card from the player's hand
            //         player.handCards.splice(cardIndex, 1);
            //         //add the card to the discard pile
            //         this.discardPile.push(card);
            //         //update the players
            //         this.updatePlayersGameState(io);
            //     });

            //     player.playerSocket!.on("fold", () => {
            //         console.log("fold");
            //         //remove the player from the players array
            //         this.players = this.players.filter(
            //             (filterPlayer) => filterPlayer.playerId !== player.playerId
            //         );
            //         //update the players
            //         this.updatePlayersGameState(io);
            //     });

            //     player.playerSocket!.on("showCards", () => {
            //         console.log("showCards");
            //         //remove the face down cards from the player's face down cards
            //         player.faceDownCards = [];
            //         //update the players
            //         this.updatePlayersGameState(io);
            //     });

            //     player.playerSocket!.on("hideCards", () => {
            //         console.log("hideCards");
            //         //add the face down cards to the player's face down cards
            //         player.faceDownCards = [
            //             ...player.faceDownCards,
            //             ...player.faceUpCards,
            //         ];
            //         //remove the face up
        });
    }
}

export default TeenPatti;
