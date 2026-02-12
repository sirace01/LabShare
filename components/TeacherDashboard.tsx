import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, MonitorOff, Users, Radio, AlertCircle } from 'lucide-react';
import { RTC_CONFIG, PeerConnectionMap } from '../types';

interface TeacherDashboardProps {
  onBack: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onBack }) => {
  const [viewerCount, setViewerCount] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<PeerConnectionMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize Socket and WebRTC Listeners
  useEffect(() => {
    // Determine socket URL: Use env var if present (for Vercel + External Server), otherwise default to local relative path
    const socketUrl = (import.meta as any).env.VITE_SERVER_URL || '/';
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect_error', (err) => {
      console.error("Socket connection error:", err);
      if (!(import.meta as any).env.VITE_SERVER_URL) {
         setError("Cannot connect to server. If deployed on Vercel, you must host the 'server.js' separately and set VITE_SERVER_URL.");
      }
    });

    socket.on('connect', () => {
      console.log('Teacher connected to signaling server');
      setError(null);
      // Announce presence as broadcaster
      socket.emit('broadcaster');
    });

    socket.on('watcher', async (id: string) => {
      console.log('New watcher connected:', id);
      
      // If we are not broadcasting yet, we can't accept the watcher.
      // They will be notified to retry when we emit 'broadcaster' in startBroadcast()
      if (!localStreamRef.current) {
        console.warn('No local stream active, ignoring watcher for now:', id);
        return;
      }

      const peerConnection = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current[id] = peerConnection;

      // Add local stream tracks to the new peer connection
      localStreamRef.current.getTracks().forEach((track) => {
        if (localStreamRef.current) {
          peerConnection.addTrack(track, localStreamRef.current);
        }
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };

      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', id, peerConnection.localDescription);
        setViewerCount((prev) => prev + 1);
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    });

    socket.on('answer', (id: string, description: RTCSessionDescriptionInit) => {
      console.log('Received answer from:', id);
      const peerConnection = peerConnectionsRef.current[id];
      if (peerConnection) {
        peerConnection.setRemoteDescription(description);
      }
    });

    socket.on('candidate', (id: string, candidate: RTCIceCandidateInit) => {
      console.log('Received candidate from:', id);
      const peerConnection = peerConnectionsRef.current[id];
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('disconnectPeer', (id: string) => {
      console.log('Watcher disconnected:', id);
      const peerConnection = peerConnectionsRef.current[id];
      if (peerConnection) {
        peerConnection.close();
        delete peerConnectionsRef.current[id];
        setViewerCount((prev) => Math.max(0, prev - 1));
      }
    });

    return () => {
      if (socket) socket.disconnect();
      Object.values(peerConnectionsRef.current).forEach((pc) => (pc as RTCPeerConnection).close());
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startBroadcast = async () => {
    setError(null);
    try {
      // @ts-ignore - getDisplayMedia exists in modern browsers
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true // Capture system audio if available
      });

      localStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsBroadcasting(true);

      // CRITICAL FIX: Announce we are live! 
      // This tells students who joined *before* we started to re-send their 'watcher' request.
      socketRef.current?.emit('broadcaster');

      // Handle stream stop via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopBroadcast();
      };
      
    } catch (err) {
      console.error("Error accessing display media:", err);
      setError("Failed to start screen share. Please ensure permissions are granted and you are using a secure context (HTTPS/localhost).");
    }
  };

  const stopBroadcast = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach((pc) => (pc as RTCPeerConnection).close());
    peerConnectionsRef.current = {};
    setViewerCount(0);
    setIsBroadcasting(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
            title="Back to Role Selection"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isBroadcasting ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            <h1 className="text-xl font-bold text-white">Teacher Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-300 bg-slate-700/50 px-3 py-1.5 rounded-lg">
            <Users size={20} className="text-indigo-400" />
            <span className="font-mono font-bold">{viewerCount}</span>
            <span className="text-sm">Students Connected</span>
          </div>
          
          {isBroadcasting ? (
            <button
              onClick={stopBroadcast}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all font-semibold"
            >
              <MonitorOff size={20} />
              Stop Sharing
            </button>
          ) : (
            <button
              onClick={startBroadcast}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all font-semibold"
            >
              <Radio size={20} />
              Start Broadcast
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col items-center justify-center overflow-hidden">
        {error && (
           <div className="absolute top-24 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-50">
             <AlertCircle size={20} />
             {error}
           </div>
        )}

        <div className="w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700 relative">
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-slate-950"
            autoPlay
            muted // Muted locally to prevent echo
            playsInline
          />
          
          {!isBroadcasting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <div className="p-6 rounded-full bg-slate-800 mb-6 text-slate-600">
                <Radio size={64} />
              </div>
              <h3 className="text-2xl font-bold text-slate-300 mb-2">Ready to Broadcast</h3>
              <p className="text-slate-500">Click the button above to start sharing your screen.</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-slate-500 text-sm">
          Preview of your broadcast. You are sharing this screen with the class.
        </div>
      </main>
    </div>
  );
};