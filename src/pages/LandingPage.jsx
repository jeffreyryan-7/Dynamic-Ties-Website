import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useEffect, useState, useRef } from "react";
import musicalTie from "../assets/musical-tie.png";
import exploreImage from "../assets/Explore Network screenshot.png";
import databaseImage from "../assets/Orchestra Database Screenshot.png";
import analysisImage from "../assets/Analysis papers screenshot.png";

export default function LandingPage() {
  const [visibleBoxes, setVisibleBoxes] = useState([false, false, false]);
  const [tieDrawn, setTieDrawn] = useState(false);
  const [titleWidth, setTitleWidth] = useState(0);
  const titleRef = useRef(null);

  useEffect(() => {
    if (titleRef.current) {
      const width = titleRef.current.offsetWidth;
      setTitleWidth(width);
    }

    const startDelay = setTimeout(() => {
      const timers = visibleBoxes.map((_, index) => 
        setTimeout(() => {
          setVisibleBoxes(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        }, index * 300)
      );

      setTieDrawn(true);

      return () => timers.forEach(timer => clearTimeout(timer));
    }, 500);

    return () => {
      clearTimeout(startDelay);
    };
  }, []);

  return (
    <Layout>
      <style>
        {`
          @media (min-width: 768px) {
            .landing-header {
              margin-top: 3rem !important;
            }
            .landing-grid {
              display: flex !important;
              flex-direction: row !important;
              gap: 1.5rem !important;
              width: 95% !important;
              max-width: 1600px !important;
              margin: 0 auto !important;
              padding: 0 !important;
              margin-top: 3rem !important;
              align-items: flex-start !important;
            }
            .musical-tie {
            top: -75px !important;
            }
            .nav-card {
              flex: 1 !important;
              aspect-ratio: 16/9 !important;
              min-height: 400px !important;
              display: flex !important;
              flex-direction: column !important;
            }
          }
          @media (max-width: 767px) {
            .landing-header {
              margin-top: 0.5rem !important;
            }
            .landing-grid {
              gap: 1.75rem !important;
              width: 90% !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
            }
            .musical-tie {
              top: -39px !important;
            }
            .nav-card {
              width: 100% !important;
              max-width: 500px !important;
              aspect-ratio: 16/9 !important;
              min-height: 300px !important;
            }
          }
        `}
      </style>
      <div className="landing-header" style={{ position: 'relative', marginBottom: '1rem' }}>
        <h1 className="site-title" style={{ position: 'relative', fontSize: '5rem', marginBottom: '1.875rem' }}>
          <img 
            src={musicalTie} 
            alt=""
            className="musical-tie"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${titleWidth}px`,
              height: 'auto',
              objectFit: 'contain',
              opacity: 1,
              clipPath: tieDrawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transition: 'clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          <span ref={titleRef}>Dynamic Ties</span>
        </h1>
        <h2 className="site-subtitle" style={{ fontSize: '2.25rem', lineHeight: '1.05' }}>
          Where symphony orchestras meet data science
        </h2>
      </div>

      <div className="landing-grid">
        <Link 
          to="/explore" 
          className="nav-card"
          style={{
            opacity: visibleBoxes[0] ? 1 : 0,
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            display: 'block',
            overflow: 'hidden',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          }}
        >
          <img 
            src={exploreImage} 
            alt="Explore Network"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top left',
            }}
          />
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'rgba(45, 95, 255, 0.9)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            fontSize: '1.25rem',
            fontWeight: '500',
          }}>
            Explore network
          </div>
        </Link>
        <Link 
          to="/database" 
          className="nav-card"
          style={{
            opacity: visibleBoxes[1] ? 1 : 0,
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            display: 'block',
            overflow: 'hidden',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          }}
        >
          <img 
            src={databaseImage} 
            alt="View Database"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top left',
            }}
          />
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'rgba(45, 95, 255, 0.9)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            fontSize: '1.25rem',
            fontWeight: '500',
          }}>
            View database
          </div>
        </Link>
        <Link 
          to="/analysis" 
          className="nav-card"
          style={{
            opacity: visibleBoxes[2] ? 1 : 0,
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            display: 'block',
            overflow: 'hidden',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          }}
        >
          <img 
            src={analysisImage} 
            alt="Data Analysis"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top left',
            }}
          />
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'rgba(45, 95, 255, 0.9)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            fontSize: '1.25rem',
            fontWeight: '500',
          }}>
            Data analysis
          </div>
        </Link>
      </div>

      <div style={{
        marginTop: '4rem',
        marginBottom: '2rem',
        textAlign: 'center',
        opacity: visibleBoxes[2] ? 1 : 0,
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '100%',
        maxWidth: '1600px',
        padding: '0 2rem',
      }}>
        <div style={{
          height: '2.5px',
          backgroundColor: 'var(--blue-accent-light)',
          width: '100%',
          marginBottom: '2rem',
        }} />
        <Link 
          to="/about" 
          style={{
            color: 'var(--blue-accent-light)',
            fontSize: '1.75rem',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            transition: 'color 0.2s ease-in-out',
          }}
          onMouseOver={(e) => e.target.style.color = '#ffffff'}
          onMouseOut={(e) => e.target.style.color = 'var(--blue-accent-light)'}
        >
          About
        </Link>
      </div>
    </Layout>
  );
}
