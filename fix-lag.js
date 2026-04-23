const fs = require('fs');

let code = fs.readFileSync('app/src/screens/LandingPage.tsx', 'utf8');

// Add imports if missing
if (!code.includes('useMotionValue')) {
  code = code.replace("import { motion, useScroll", "import { motion, useMotionValue, useScroll");
}
if (!code.includes('useRef')) {
  code = code.replace("import React, { ", "import React, { useRef, ");
}

let modified = code;

// 1. Fix global useMousePosition hook via RAF throttle
modified = modified.replace(
`    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };`,
`    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setPosition({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2
        });
      });
    };`
);


// 2. Fix DemoCard3D
modified = modified.replace(
  `  const [rotation, setRotation] = useState({ x: 0, y: 0 });`,
  `  const rx = useMotionValue(0);\n  const ry = useMotionValue(0);\n  const springConfig = { stiffness: 150, damping: 20 };\n  const smoothX = useSpring(rx, springConfig);\n  const smoothY = useSpring(ry, springConfig);`
);

// We use regex to replace only the occurrence inside DemoCard3D (the first one)
modified = modified.replace(
  `    setRotation({ x: -x, y: y });`,
  `    rx.set(-x);\n    ry.set(y);`
);

modified = modified.replace(
  `    setRotation({ x: 0, y: 0 });`,
  `    rx.set(0);\n    ry.set(0);`
);

modified = modified.replace(
  `          transform: \`rotateX(\${rotation.x}deg) rotateY(\${rotation.y}deg)\`,`,
  `          rotateX: smoothX,\n          rotateY: smoothY,`
);


// 3. Fix StepCardFlow
modified = modified.replace(
  `  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });`,
  `  const mx = useMotionValue(0);\n  const my = useMotionValue(0);\n  const smoothX = useSpring(mx, { stiffness: 150, damping: 20 });\n  const smoothY = useSpring(my, { stiffness: 150, damping: 20 });`
);

modified = modified.replace(
  `    setMousePos({ x, y });`,
  `    mx.set(x);\n    my.set(y);`
);

modified = modified.replace(
  `        onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}`,
  `        onMouseLeave={() => { setIsHovered(false); mx.set(0); my.set(0); }}`
);

modified = modified.replace(
  `          transform: \`rotateY(\${mousePos.y}deg) rotateX(\${-mousePos.x}deg)\`,`,
  `          rotateX: useTransform(smoothX, v => -v),\n          rotateY: smoothY,`
);


// 4. Fix PersonaCardEnhanced
modified = modified.replace(
  `  const [rotation, setRotation] = useState({ x: 0, y: 0 });`,
  `  const rx = useMotionValue(0);\n  const ry = useMotionValue(0);\n  const smoothX = useSpring(rx, { stiffness: 150, damping: 20 });\n  const smoothY = useSpring(ry, { stiffness: 150, damping: 20 });`
);

modified = modified.replace(
  /    setRotation\(\{\s*x:\s*-x,\s*y:\s*y\s*\}\);/g,
  `    rx.set(-x);\n    ry.set(y);`
);

modified = modified.replace(
  `        onMouseLeave={() => { setIsHovered(false); setRotation({ x: 0, y: 0 }); }}`,
  `        onMouseLeave={() => { setIsHovered(false); rx.set(0); ry.set(0); }}`
);

modified = modified.replace(
  `          transform: \`rotateY(\${rotation.y}deg) rotateX(\${rotation.x}deg)\`,`,
  `          rotateX: smoothX,\n          rotateY: smoothY,`
);

fs.writeFileSync('app/src/screens/LandingPage.tsx', modified);
console.log('Successfully patched LandingPage.tsx components to use Framer Motion optimized states.');

