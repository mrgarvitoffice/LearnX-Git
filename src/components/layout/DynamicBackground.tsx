"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const DynamicBackground = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Extremely optimized energy orbs for desktop smoothness
  const orbs = useMemo(() => [
    { size: 300, duration: 45, delay: 0, x: ["10%", "80%", "10%"], y: ["20%", "70%", "20%"] },
    { size: 400, duration: 60, delay: 5, x: ["70%", "10%", "70%"], y: ["60%", "10%", "60%"] },
  ], []);

  if (!isClient) return <div id="background-neural" />;

  return (
    <>
      <div id="background-neural" />
      <div className="neural-mesh" />
      <div className="neural-grid" />
      
      <div className="fixed inset-0 z-[-8] overflow-hidden pointer-events-none">
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/5 blur-[80px]"
            animate={{
              x: orb.x,
              y: orb.y,
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              ease: "linear",
              delay: orb.delay
            }}
            style={{
              width: orb.size + "px",
              height: orb.size + "px",
              willChange: "transform",
            }}
          />
        ))}
      </div>
      <div className="fixed inset-0 pointer-events-none -z-5 opacity-5 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
    </>
  );
};

export default DynamicBackground;