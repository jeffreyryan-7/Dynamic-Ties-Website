import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useEffect, useState, useRef } from "react";
import musicalTie from "../assets/musical-tie.png";

export default function LandingPage() {
  const [tieDrawn, setTieDrawn] = useState(false);
  const [titleWidth, setTitleWidth] = useState(0);
  const [titlePosition, setTitlePosition] = useState({ top: 0, left: 0 });
  const titleRef = useRef(null);

  useEffect(() => {
    // Measure title width and position
    if (titleRef.current) {
      const width = titleRef.current.offsetWidth;
      const rect = titleRef.current.getBoundingClientRect();
      setTitleWidth(width);
      setTitlePosition({
        top: rect.top,
        left: rect.left
      });
    }

    // Start the tie animation after a short delay
    const startDelay = setTimeout(() => {
      setTieDrawn(true);
    }, 500);

    return () => {
      clearTimeout(startDelay);
    };
  }, []);

  return (
    <Layout>
      <div style={{ 
        position: 'absolute',
        top: '50px',
        left: '25px',
        zIndex: 1000
      }}>
        <div style={{ position: 'relative' }}>
          <Link 
            to="/" 
            style={{
              position: 'absolute',
              top: '-25px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${titleWidth}px`,
              display: 'block',
              opacity: 1,
              clipPath: tieDrawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transition: 'clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <img 
              src={musicalTie} 
              alt="Musical Tie"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Link>
        </div>

          <Link 
            ref={titleRef}
            to="/" 
            style={{ 
              textDecoration: 'none', 
              color: 'inherit',
              fontSize: '30px',
              display: 'block'
            }}
          >
            Dynamic Ties
          </Link>
      </div>

      <div style={{ marginTop: '4rem' }}>
      <h1 className="site-title leading-snug pb-1" style={{ fontSize: '3.125rem', marginBottom: '1rem' }}>
        Read analysis papers
      </h1>
      <div style={{ padding: "3.25rem", maxWidth: "1125px", margin: "0 auto" }}>
        {[
          {
            title: "From Studio to Symphony",
            description: "An analysis of educational backgrounds among musicians in top U.S. orchestras.",
            image: "/images/cum_dist_teaser.png",
            pdfPath: "/papers/From_Studio_to_Symphony.pdf"
          }
        ].map((paper, index) => (
          <a
            key={index}
            href={paper.pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "2.5rem",
              gap: "1.25rem",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              transition: "transform 0.2s ease-in-out",
              ":hover": {
                transform: "translateY(-2px)"
              }
            }}
          >
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1.5625rem", marginBottom: "0.625rem", paddingBottom: "0rem" }}>
                {paper.title}
              </h2>
              <div
                style={{
                  height: "2.5px",
                  backgroundColor: "#2d5fff",
                  width: "100%",
                  margin: "0rem 1rem 0.8rem 0rem",
                  paddingTop: "0.3125rem"
                }}
              />
              <p style={{ fontSize: "1.25rem", lineHeight: "1.5" }}>{paper.description}</p>
            </div>
            <img
              src={paper.image}
              alt={`Image for ${paper.title}`}
              style={{
                width: "187.5px",
                height: "125px",
                objectFit: "cover",
                borderRadius: "10px",
                flexShrink: 0
              }}
            />
          </a>
        ))}
      </div>
    </div>
    </Layout>
  );
}
  