'use client';
import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame
} from "framer-motion";

export const InteractiveGridBackground = ({ children, className }) => {
  const containerRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0.6;
  const speedY = 0.6;

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + speedX) % 40);
    gridOffsetY.set((gridOffsetY.get() + speedY) % 40);
  });

  // stronger spotlight
  const maskImage = useMotionTemplate`
    radial-gradient(320px circle at ${mouseX}px ${mouseY}px, 
    rgba(0,0,0,1) 0%, 
    rgba(0,0,0,0.8) 35%, 
    transparent 75%)
  `;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative w-full min-h-screen flex flex-col overflow-hidden bg-white text-slate-900",
        className
      )}
    >

      {/* base grid */}
      <div className="absolute inset-0 z-0 opacity-40">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </div>

      {/* highlighted grid */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern
          offsetX={gridOffsetX}
          offsetY={gridOffsetY}
          className="text-blue-500"
          strokeWidth={1.4}
        />
      </motion.div>

      {/* glow layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <div className="absolute inset-0 bg-blue-400/20 blur-3xl" />
      </motion.div>

      {/* decorative orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-[-10%] top-[-10%] w-[30%] h-[30%] rounded-full bg-blue-200 blur-[120px]" />
        <div className="absolute left-[-10%] bottom-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-200 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col w-full h-full flex-1">
        {children}
      </div>

    </div>
  );
};

const GridPattern = ({ offsetX, offsetY, className, strokeWidth = 1 }) => {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id="grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={cn("text-slate-300", className)}
          />
        </motion.pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
};