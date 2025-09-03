
"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import io, { Socket } from "socket.io-client";

export default function View() {
    const { sessionId } = useParams();
    const videoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3000");
        socketRef.current = socket;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        // Handle incoming stream
        pc.ontrack = (event) => {
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", { sessionId, candidate: event.candidate });
            }
        };

        // Handle offer
        socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { sessionId, answer });
        });

        // Handle incoming ICE candidates
        socket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
            if (pcRef.current) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        socket.emit("joinSession", sessionId);

        return () => {
            pc.close();
            socket.disconnect();
        };
    }, [sessionId]);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-neutral-100">
            <div className="absolute top-0 left-0 right-0 p-4 bg-white shadow-sm z-20">
                <h1 className="text-base font-semibold">Watching Bezalel Session {sessionId}</h1>
            </div>
            <div className="flex w-full h-full pt-16 items-center justify-center bg-neutral-200">
                <video
                    ref={videoRef}
                    autoPlay
                    className="border rounded w-[1600px] h-[1200px] object-contain"
                />
            </div>
        </div>
    );
}