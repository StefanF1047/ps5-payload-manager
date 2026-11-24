import React, { useState } from 'react';
import { cn } from '../../utils/helpers';
import { Package } from 'lucide-react';

const COLORS = [
  ['#8b5cf6', '#6d28d9'], // violet
  ['#db2777', '#9d174d'], // pink
  ['#7c3aed', '#4338ca'], // purple / indigo
  ['#f59e0b', '#b45309'], // amber
  ['#ec4899', '#be185d'], // rose
  ['#6366f1', '#3730a3'], // indigo
  ['#c084fc', '#7e22ce'], // fuchsia
];

const stringToHash = (str) => {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const PayloadIcon = ({ icon, name, className }) => {
  const [failedIcon, setFailedIcon] = useState(null);
  const isDataUri = typeof icon === 'string' && icon.startsWith('data:image/');

  if (isDataUri && failedIcon !== icon) {
    return (
      <div className={cn("pm-icon rounded-xl overflow-hidden shrink-0 bg-white/5", className)}>
        <img
          src={icon}
          alt={name || 'Payload'}
          className="w-full h-full object-cover"
          onError={() => setFailedIcon(icon)}
        />
      </div>
    );
  }

  // Fallback
  const hash = stringToHash(name || 'Payload');
  const [colorStart, colorEnd] = COLORS[hash % COLORS.length];

  return (
    <div 
      className={cn("pm-icon rounded-xl flex items-center justify-center shrink-0 text-white relative overflow-hidden", className)}
      style={{
        background: `radial-gradient(circle at 28% 18%, ${colorStart}44, transparent 62%), linear-gradient(135deg, ${colorStart}, ${colorEnd})`
      }}
    >
      <span className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
      <Package className="relative w-1/2 h-1/2 opacity-95" />
    </div>
  );
};

export default PayloadIcon;
