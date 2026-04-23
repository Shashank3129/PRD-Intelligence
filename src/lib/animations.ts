import type { Variants, Easing } from 'framer-motion';

// Easing functions
export const easings = {
  smooth: [0.23, 1, 0.32, 1] as [number, number, number, number],
  bounce: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

// Stagger container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Stagger item
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easings.smooth,
    },
  },
};

// Slide up with 3D effect
export const slideUp3D: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50, 
    rotateX: -15,
    scale: 0.95 
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: easings.smooth,
    },
  },
};

// Fade in with scale
export const fadeInScale: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9 
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easings.gentle,
    },
  },
};

// Card hover 3D
export const cardHover3D = {
  rest: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: { duration: 0.3, ease: easings.gentle }
  },
  hover: {
    rotateX: 5,
    rotateY: -5,
    scale: 1.02,
    transition: { duration: 0.3, ease: easings.gentle }
  }
};

// Floating animation
export const floatingAnimation = {
  y: [0, -10, 0],
  rotate: [0, 2, 0, -2, 0],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

// Pulse scale
export const pulseScale = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

// Glow pulse
export const glowPulse = {
  boxShadow: [
    '0 0 20px rgba(99, 102, 241, 0.3)',
    '0 0 40px rgba(99, 102, 241, 0.5)',
    '0 0 20px rgba(99, 102, 241, 0.3)'
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

// Background blob animation
export const blobAnimation = (delay: number = 0) => ({
  scale: [1, 1.2, 1],
  x: [0, 30, 0],
  y: [0, -20, 0],
  transition: {
    duration: 10,
    repeat: Infinity,
    ease: 'easeInOut' as Easing,
    delay
  }
});

// Text reveal
export const textReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    filter: 'blur(10px)'
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: easings.smooth,
    },
  },
};

// Page transition
export const pageTransition: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.98 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easings.gentle,
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: easings.gentle,
    }
  }
};

// Scroll reveal
export const scrollReveal = (delay: number = 0): Variants => ({
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay,
      ease: easings.smooth,
    },
  },
});

// 3D Flip
export const flip3D: Variants = {
  hidden: { 
    opacity: 0, 
    rotateY: -90 
  },
  visible: {
    opacity: 1,
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: easings.smooth,
    },
  },
};

// Magnetic button effect helper
export const magneticEffect = (_strength: number = 0.3) => ({
  x: 0,
  y: 0,
  transition: { type: 'spring', stiffness: 150, damping: 15 }
});