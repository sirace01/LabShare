import React from 'react';
import { Monitor, Users } from 'lucide-react';

interface RoleSelectionProps {
  onSelectTeacher: () => void;
  onSelectStudent: () => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectTeacher, onSelectStudent }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
          LabCast
        </h1>
        <p className="text-slate-400 text-lg">
          Low-latency local screen sharing for computer laboratories.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
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
      
      <div className="mt-12 text-sm text-slate-500 max-w-md text-center">
        <p>
          <strong>Note:</strong> This app requires a secure context (HTTPS or localhost) for screen sharing capabilities. Ensure the server is running on the same LAN.
        </p>
      </div>
    </div>
  );
};