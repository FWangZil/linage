
import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { SILK_THREAD_PATH } from '../constants';

const SilkPath: React.FC = () => {
  const [pathLength, setPathLength] = useState(0);
  const [isWiggling, setIsWiggling] = useState(false);
  const [footerOpacity, setFooterOpacity] = useState(1);
  // Fix: Explicitly typed pathRef to SVGPathElement to resolve the Ref<never> issue
  const pathRef = useRef<SVGPathElement>(null);

  const { scrollYProgress, scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  
  // Create a spring for smooth velocity response
  const velocitySpring = useSpring(scrollVelocity, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Calculate the downward "pull" based on scroll velocity
  const downwardPull = useTransform(velocitySpring, [-3000, 3000], [-30, 30]);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }

    const handleScroll = () => {
      const winHeight = window.innerHeight;
      const footer = document.querySelector('section[data-footer="true"]');
      if (footer) {
        const rect = footer.getBoundingClientRect();
        const fadeStart = winHeight;
        const fadeEnd = winHeight * 0.5;
        if (rect.top < fadeStart) {
          const opacity = Math.max(0, (rect.top - fadeEnd) / (fadeStart - fadeEnd));
          setFooterOpacity(opacity);
        } else {
          setFooterOpacity(1);
        }
      }
    };

    const handleHoverStart = () => setIsWiggling(true);
    const handleHoverEnd = () => setIsWiggling(false);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('silk-wiggle-start', handleHoverStart);
    window.addEventListener('silk-wiggle-end', handleHoverEnd);
    
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('silk-wiggle-start', handleHoverStart);
      window.removeEventListener('silk-wiggle-end', handleHoverEnd);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[5] overflow-hidden transition-opacity duration-500"
      style={{ opacity: footerOpacity }}
    >
      <svg 
        viewBox="0 0 1000 5000" 
        preserveAspectRatio="xMidYMin slice"
        className="w-full h-[5000px]"
      >
        <defs>
          <linearGradient id="silk-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="85%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="silk-mask">
            <rect x="0" y="0" width="1000" height="5000" fill="url(#silk-fade)" />
          </mask>
        </defs>

        <motion.g
          style={{
            y: downwardPull,
            mask: 'url(#silk-mask)'
          }}
        >
          {/* Main Swaying Path */}
          <motion.path
            // Fix: Cast ref to any to bypass strict Ref<never> check in problematic type environments
            ref={pathRef as any}
            d={SILK_THREAD_PATH}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="0.8"
            strokeDasharray={pathLength}
            style={{ 
              pathLength: scrollYProgress,
              opacity: 0.6
            }}
            animate={{
              x: isWiggling ? [0, 5, -5, 0] : [0, 2, -2, 0],
              skewX: isWiggling ? [0, 1, -1, 0] : [0, 0.2, -0.2, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="transition-all duration-300 ease-out"
          />
          
          {/* The Needle Tip */}
          <motion.g 
            style={{
              offsetPath: `path("${SILK_THREAD_PATH}")`,
              offsetDistance: useTransform(scrollYProgress, p => `${p * 100}%`)
            }}
          >
            <motion.circle 
              r="1.2" 
              fill="#D4AF37" 
              style={{ opacity: 0.8 }}
              animate={{ r: [1.2, 1.8, 1.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.g>

          {/* Low frequency background sway - another thread slightly offset */}
          <motion.path
            d={SILK_THREAD_PATH}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="0.3"
            opacity="0.15"
            style={{ pathLength: scrollYProgress }}
            animate={{
              x: [-3, 3, -3],
              y: [2, -2, 2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.g>
      </svg>

      <style>{`
        /* Use CSS for additional fine-grained sway if needed, 
           but motion props are preferred for sync with velocity */
      `}</style>
    </div>
  );
};

export default SilkPath;
