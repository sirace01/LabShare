import React, { useState } from 'react';
import { Monitor, Users, Settings, Server } from 'lucide-react';

interface RoleSelectionProps {
  onSelectTeacher: () => void;
  onSelectStudent: () => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ 
  onSelectTeacher, 
  onSelectStudent, 
  serverUrl, 
  setServerUrl 
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800 relative">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
          LabCast
        </h1>
        <p className="text-slate-400 text-lg">
          Low-latency local screen sharing for computer laboratories.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full z-10">
        {/* Teacher Card */}
        <button
          onClick={onSelectTeacher}
          className="group relative flex flex-col items-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-indigo-500 transition-all duration-300 hover:bg-slate-800 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
        >
          <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            <Monitor size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Teacher</h2>
          <p className="text-slate-400 text-center">
            Broadcast your screen to all connected students.
          </p>
        </button>

        {/* Student Card */}
        <button
          onClick={onSelectStudent}
          className="group relative flex flex-col items-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-cyan-500 transition-all duration-300 hover:bg-slate-800 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1"
        >
          <div className="p-4 rounded-full bg-cyan-500/10 text-cyan-400 mb-6 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
            <Users size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Student</h2>
          <p className="text-slate-400 text-center">
            Join the session and view the teacher's screen.
          </p>
        </button>
      </div>
      
      {/* Footer / Settings */}
      <div className="mt-16 w-full max-w-md">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center justify-center gap-2 w-full text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"
        >
          <Settings size={14} />
          {showSettings ? 'Hide Connection Settings' : 'Configure Server Connection'}
        </button>

        {showSettings && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2">
            <label className="block text-xs uppercase font-bold text-slate-500 mb-2 flex items-center gap-2">
              <Server size={12} />
              Signaling Server URL
            </label>
            <input 
              type="text" 
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. https://my-socket-server.onrender.com"
            />
            <p className="text-xs text-slate-500 mt-2">
              If deploying the frontend to Vercel, you must host the <code>server.js</code> separately (e.g., Render, Railway) and paste the URL here.
            </p>
          </div>
        )}

        {!showSettings && (
           <p className="text-xs text-slate-600 text-center">
             Server: <span className="font-mono text-slate-500">{serverUrl}</span>
           </p>
        )}
      </div>
    </div>
  );
};