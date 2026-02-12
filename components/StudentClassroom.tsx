import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, Maximize2, Minimize2, Wifi, WifiOff } from 'lucide-react';
import { RTC_CONFIG } from '../types';

interface StudentClassroomProps {
  onBack: () => void;
}

export const StudentClassroom: React.FC<StudentClassroomProps> = ({ onBack }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamActive, setStreamActive] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io('/', {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Student connected to signaling server');
      setIsConnected(true);
      // Initiate request to watch
      socket.emit('watcher');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setStreamActive(false);
    });

    socket.on('offer', async (id: string, description: RTCSessionDescriptionInit) => {
      console.log('Received offer from broadcaster:', id);
      
      const peerConnection = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };

      peerConnection.ontrack = (event) => {
        console.log('Received remote track');
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setStreamActive(true);
        }
      };

      await peerConnection.setRemoteDescription(description);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('answer', id, peerConnection.localDescription);
    });

    socket.on('candidate', (id: string, candidate: RTCIceCandidateInit) => {
      peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('broadcaster', () => {
      // If a broadcaster joins/rejoins, we re-emit watcher to reconnect
      socket.emit('watcher');
    });

    socket.on('disconnectPeer', () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
        setStreamActive(false);
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    });

    // Mobile/Tablet viewport fix
    window.addEventListener('resize', handleResize);

    return () => {
      if (socket) socket.disconnect();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleResize = () => {
    // Optional logic to handle resizing if needed beyond CSS
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-black">
      {/* Overlay Controls (visible on hover or when UI needed) */}
      <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 z-10 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isFullscreen && (
              <button 
                onClick={onBack}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-white backdrop-blur-sm transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-white shadow-black drop-shadow-md">Classroom View</h1>
              <div className="flex items-center gap-2 text-xs">
                 {isConnected ? (
                   <span className="text-emerald-400 flex items-center gap-1"><Wifi size={12}/> Connected</span>
                 ) : (
                   <span className="text-red-400 flex items-center gap-1"><WifiOff size={12}/> Disconnected</span>
                 )}
                 {streamActive ? (
                   <span className="text-indigo-400 font-semibold">• Live Stream Active</span>
                 ) : (
                   <span className="text-slate-400">• Waiting for teacher...</span>
                 )}
              </div>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-white backdrop-blur-sm transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {!streamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-0">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium">Waiting for broadcast...</p>
            <p className="text-sm opacity-70">The teacher hasn't started sharing yet.</p>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          controls={false}
        />
      </div>
    </div>
  );
};