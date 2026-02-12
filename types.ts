export interface PeerConnectionMap {
  [socketId: string]: RTCPeerConnection;
}

export interface IceCandidateMessage {
  id: string; // socket id of the sender
  candidate: RTCIceCandidateInit;
}

export interface SessionDescriptionMessage {
  id: string; // socket id of the sender
  description: RTCSessionDescriptionInit;
}

// Configuration for WebRTC. 
// For a purely local LAN setup without internet, you might not even need Google's STUN server, 
// but it helps traverse NATs even in some complex local network topologies.
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};