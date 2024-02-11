import React from "react";

import { Card as CardType } from "../../../../backend/game";
import Texture from "./texture.png";

type Props = {
    Card: CardType;
    disabled?: boolean;
    onclick?: () => void;
};

export default function Card({
    Card,
    disabled = true,
    onclick = () => {
        console.log("Clicked Card is: ", Card.suit, ", ", Card.value);
    },
}: Props) {
    return (
        <button
            className="relative w-16 h-24 text-black transition-all duration-200 bg-white border border-black rounded-lg hover:enabled:-translate-y-6"
            style={{ filter: disabled ? "opacity(90%)" : "" }}
            disabled={disabled}
            type="button"
            onClick={onclick}
        >
            <div className="absolute top-[0.125rem] left-1">{Symbol(Card)}</div>
            <div className="absolute rotate-180 bottom-[0.125rem] right-1">
                {Symbol(Card)}
            </div>
        </button>
    );
}

export function FaceDownCard() {
    return (
        <div
            className="relative w-16 h-24 text-black bg-white border border-black rounded-lg"
            style={{
                backgroundImage: `url(${Texture})`,
                //stretch image to fit
                backgroundSize: "100% 100%",
            }}
        ></div>
    );
}

function Symbol(Card: CardType) {
    switch (Card.suit) {
        case 0:
            return <p className="text-red-500">{value(Card)}♦</p>;
        case 1:
            return <p>{value(Card)}♣</p>;
        case 2:
            return <p className="text-red-500">{value(Card)}♥</p>;
        case 3:
            return <p>{value(Card)}♠</p>;
    }
}

function value(Card: CardType) {
    switch (Card.value) {
        case 11:
            return "J";
        case 12:
            return "Q";
        case 13:
            return "K";
        case 14:
            return "A";
        default:
            return Card.value;
    }
}
