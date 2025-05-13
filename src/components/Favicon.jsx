import React from 'react';
import musicalTie from "../assets/musical-tie.png";

export default function Favicon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rounded square background */}
      <rect width="32" height="32" rx="6" fill="#0f1e30"/>
      
      {/* Musical tie image */}
      <image
        href={musicalTie}
        width="24"
        height="24"
        x="4"
        y="4"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
} 