"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function PurpleAesthetic() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-1 overflow-hidden pointer-events-none">
      {/* Animated purple gradient orbs */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: `${200 + i * 100}px`,
            height: `${200 + i * 100}px`,
            background: `radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(255, 0, 255, 0.3) 0%, transparent 100%)`,
            left: `${10 + i * 15}%`,
            top: `${10 + i * 12}%`,
          }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -40, 40, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Floating purple particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${4 + (i % 3) * 2}px`,
            height: `${4 + (i % 3) * 2}px`,
            background: `rgba(139, 92, 246, ${0.3 + (i % 3) * 0.1})`,
            left: `${(i * 8.33) % 100}%`,
            top: `${(i * 7.5) % 100}%`,
            boxShadow: `0 0 ${10 + i * 2}px rgba(139, 92, 246, 0.5)`,
          }}
          animate={{
            y: [0, -30, 30, 0],
            x: [0, 20, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + (i % 3) * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Large background gradient */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(ellipse at top, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                       radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.2) 0%, transparent 50%)`,
        }}
        animate={{
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated purple mesh gradient */}
      <motion.div
        className="absolute inset-0 opacity-5"
        style={{
          background: `
            linear-gradient(45deg, transparent 30%, rgba(139, 92, 246, 0.1) 50%, transparent 70%),
            linear-gradient(-45deg, transparent 30%, rgba(168, 85, 247, 0.1) 50%, transparent 70%)
          `,
          backgroundSize: "200% 200%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
