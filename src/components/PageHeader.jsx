import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import musicalTie from "../assets/musical-tie.png";

export default function PageHeader() {
  const [tieDrawn, setTieDrawn] = useState(false);
  const [titleWidth, setTitleWidth] = useState(0);
  const titleRef = useRef(null);

  useEffect(() => {
    // Function to measure title width
    const measureTitle = () => {
      if (titleRef.current) {
        const width = titleRef.current.offsetWidth;
        setTitleWidth(width);
      }
    };

    // Initial measurement
    measureTitle();

    // Start the tie animation after we have the width
    if (titleWidth > 0) {
      const startDelay = setTimeout(() => {
        setTieDrawn(true);
      }, 500);
      return () => clearTimeout(startDelay);
    }

    // Add resize listener to handle window resizing
    window.addEventListener('resize', measureTitle);
    return () => window.removeEventListener('resize', measureTitle);
  }, [titleWidth]); // Re-run when titleWidth changes

  return (
    <Link to="/" className="site-brand" style={{ 
      textDecoration: 'none', 
      color: 'inherit',
      position: 'absolute',
      top: '50px',
      left: '25px',
      fontSize: '30px',
      zIndex: 1000
    }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src={musicalTie} 
          alt=""
          style={{
            position: 'absolute',
            top: '-75px',
            width: '250px',
            height: 'auto',
            objectFit: 'contain',
            opacity: 1,
            clipPath: tieDrawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
            transition: 'clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <span ref={titleRef} style={{ marginTop: '25px' }}>Dynamic Ties</span>
      </div>
    </Link>
  );
} 