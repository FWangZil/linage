
import React from 'react';

export const WINDOW_MASKS = {
  // Cleaned up Haitang shape (Single closed loop)
  haitang: "M 50,2 C 75,2 85,15 85,25 C 85,35 98,45 98,50 C 98,55 85,65 85,75 C 85,85 75,98 50,98 C 25,98 15,85 15,75 C 15,65 2,55 2,50 C 2,45 15,35 15,25 C 15,15 25,2 50,2 Z",
  // Cleaned Octagon
  octagon: "M 30,2 L 70,2 L 98,30 L 98,70 L 70,98 L 30,98 L 2,70 L 2,30 Z",
  // Smooth Circle
  moon: "M 50,5 A 45,45 0 1 1 49.9,5 Z",
  square: "M 5,5 L 95,5 L 95,95 L 5,95 Z"
};

/**
 * A more intricate, winding path that meanders through the page.
 * Designed for a 1000x5000 viewBox.
 */
export const SILK_THREAD_PATH = `
  M 500,50 
  C 550,150 400,200 300,350 
  S 450,550 600,700 
  S 200,850 150,1100 
  S 400,1400 700,1600 
  S 850,1900 500,2100 
  S 150,2400 300,2700 
  S 750,3000 800,3300 
  S 400,3600 200,3900 
  S 600,4200 500,4500 
  S 300,4800 500,4950
`;
