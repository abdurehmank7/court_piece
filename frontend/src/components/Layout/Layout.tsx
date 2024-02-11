import React from "react";

type Props = {
    children: React.ReactNode;
};

export default function Layout({ children }: Props) {
    return (
        <div className="flex items-center justify-center w-screen h-screen text-white bg-gray-700">
            {children}
        </div>
    );
}
