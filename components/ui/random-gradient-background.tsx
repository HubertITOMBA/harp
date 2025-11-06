'use client';

import { useEffect, useState } from 'react';

interface RandomGradientBackgroundProps {
  children: React.ReactNode;
}

export function RandomGradientBackground({ children }: RandomGradientBackgroundProps) {
  const [angle, setAngle] = useState(135); // Angle par défaut

  useEffect(() => {
    // Générer un angle aléatoire entre 0 et 360 degrés
    const randomAngle = Math.floor(Math.random() * 360);
    setAngle(randomAngle);
  }, []);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: `linear-gradient(${angle}deg, #f3f4f6 0%, #ffffff 30%, #e5e7eb 50%, #ffffff 70%, #f3f4f6 100%)`,
      }}
    >
      {children}
    </div>
  );
}

