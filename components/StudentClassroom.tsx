import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, Maximize2, Minimize2, Wifi, WifiOff, AlertCircle, Settings } from 'lucide-react';
import { RTC_CONFIG } from '../types';

interface StudentClassroomProps {
  onBack: () => void;
  serverUrl: string;
}

export const StudentClassroom: React.FC<StudentClassroomProps> = ({ onBack, serverUrl }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const isRemoteDescriptionSet = useRef(false);

  useEffect(() => {
    // Check if user is trying to connect to a static host (like Vercel) as the backend
    const isVercel = window.location.hostname.includes('vercel.app');
    const isSameHost = serverUrl.includes(window.location.hostname);
    
    if (isVercel && isSameHost) {
      setError("Configuration Error: Vercel only hosts the frontend. Please configure a separate backend URL in settings.");
      // We still attempt to connect in case they really have some proxy setup, but warning is shown.
    }

    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Student connected to signaling server');
      setIsConnected(true);
      setError(null);
      socket.emit('watcher');
    });

    socket.on('connect_error', (err) => {
        console.error("Connection error:", err);
        setIsConnected(false);
        if (isSameHost && isVercel) {
           // Keep the specific error
        } else {
           setError(`Unable to connect to server at ${serverUrl}`);
        }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setStreamActive(false);
      isRemoteDescriptionSet.current = false;
    });

    socket.on('offer', async (id: string, description: RTCSessionDescriptionInit) => {
      const peerConnection = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = peerConnection;
      isRemoteDescriptionSet.current = false;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };

      peerConnection.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setStreamActive(true);
        }
      };

      try {
        await peerConnection.setRemoteDescription(description);
        isRemoteDescriptionSet.current = true;
        
        iceCandidateQueue.current.forEach(async (candidate) => {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding queued candidate:', e);
          }
        });
        iceCandidateQueue.current = [];

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('answer', id, peerConnection.localDescription);
      } catch (e) {
        console.error("Error handling offer:", e);
      }
    });

    socket.on('candidate', (id: string, candidate: RTCIceCandidateInit) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        if (isRemoteDescriptionSet.current) {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
        } else {
          iceCandidateQueue.current.push(candidate);
        }
      }
    });

    socket.on('broadcaster', () => {
      socket.emit('watcher');
    });

    socket.on('disconnectPeer', () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
        setStreamActive(false);
        isRemoteDescriptionSet.current = false;
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    });

    window.addEventListener('resize', handleResize);

    return () => {
      if (socket) socket.disconnect();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      window.removeEventListener('resize', handleResize);
    };
  }, [serverUrl]);

  const handleResize = () => {
    // Optional logic
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-black relative">
      {/* Error Overlay */}
      {error && !isConnected && (
         <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500/50 text-white px-6 py-4 rounded-xl flex flex-col items-center gap-2 backdrop-blur-md shadow-2xl max-w-md text-center">
            <AlertCircle size={32} className="text-red-400" />
            <h3 className="font-bold text-lg">Connection Error</h3>
            <p className="text-sm text-red-100">{error}</p>
            <button 
              onClick={onBack}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
            >
              <Settings size={14} />
              Change Server URL
            </button>
         </div>
      )}

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