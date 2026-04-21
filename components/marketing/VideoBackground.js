"use client";
import { useEffect, useRef, useState } from "react";

export default function VideoBackground({ className, src }) {
  const ref = useRef(null);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    const mem = navigator.deviceMemory;
    const conn = navigator.connection;
    if ((mem !== undefined && mem < 4) || conn?.saveData) {
      setSkip(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current?.pause();
    }
  }, []);

  if (skip) return null;
  return (
    <video
      ref={ref}
      className={className}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
    />
  );
}
