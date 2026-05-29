import React from 'react';

interface DevDocksLogoProps {
  className?: string;
}

export default function DevDocksLogo({ className = 'h-8 w-8' }: DevDocksLogoProps) {
  return (
    <img
      src="/devdocks-logo.svg"
      alt="DevDocks logo"
      className={`aspect-square shrink-0 rounded-md object-contain ${className}`}
      draggable={false}
    />
  );
}
