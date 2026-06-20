import React from 'react';

interface Animated3DHeaderProps {
  title: string;
}

export const Animated3DHeader: React.FC<Animated3DHeaderProps> = ({ title: _title }) => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 animate-pulse" />
    </div>
  );
};
