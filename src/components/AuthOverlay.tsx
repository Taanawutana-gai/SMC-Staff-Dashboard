import React from 'react';
import { Lock } from 'lucide-react';

interface AuthOverlayProps {
  onConnect: () => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onConnect }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="ig-card max-w-sm w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-[#DBDBDB]">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#262626]">Connect Google Sheets</h2>
          <p className="text-sm text-[#8E8E8E]">
            Please connect your Google account to access the staff attendance analytics dashboard.
          </p>
        </div>
        <button 
          onClick={onConnect}
          className="ig-button w-full py-2.5"
        >
          Connect with Google
        </button>
        <p className="text-[10px] text-[#8E8E8E] uppercase tracking-widest font-semibold">
          Secure Integration
        </p>
      </div>
    </div>
  );
};
