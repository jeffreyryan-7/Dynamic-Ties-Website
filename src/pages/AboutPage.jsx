import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useEffect, useState, useRef } from "react";
import musicalTie from "../assets/musical-tie.png";
import hackathonImage from "../assets/Hackathon whiteboarding.jpg";

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
      <div className="space-y-6 px-6 max-w-3xl mx-auto mt-12 text-white">
      <h1 className="site-title" style={{ fontSize: '3.125rem' }}>About Dynamic Ties</h1>

      <h2 className="text-xl font-semibold" style={{ fontSize: '1.5625rem' }}>Mission statement</h2>
      <div style={{ height: "2.5px", backgroundColor: "#2d5fff", width: "100%", margin: "0.3125rem 0"}} />
      <p className="text-base leading-relaxed" style={{ fontSize: '1.25rem', margin: "0.6875rem 0" }} >
        At Dynamic Ties, our mission is to illuminate the network of people and institutions that shape the world of classical music. 
        By collecting, structuring, and analyzing biographical data on musicians from top U.S. orchestras, we provide 
        interactive tools and visualizations that reveal how education, mentorship, and institutional affiliations 
        influence artistic careers. By improving accessibility to this knowledge, our goal is to promote transparency, foster curiosity, and support data-driven 
        conversations about access, equity, and legacy in the orchestral world.
      </p>

      <h2 className="text-xl font-semibold" style={{ fontSize: '1.5625rem' }}>Meet the founders</h2>
      <div style={{ height: "2.5px", backgroundColor: "#2d5fff", width: "100%", margin: "0.3125rem 0"}} />
      <div style={{ position: 'relative' }}>
        <img 
          src={hackathonImage} 
          alt="Team working on Dynamic Ties during hackathon" 
          style={{ 
            width: '300px',
            height: 'auto',
            float: 'left',
            marginTop: '0.687rem',
            marginRight: '20px',
            marginBottom: '10px'
          }}
        />
        <p className="text-base leading-relaxed" style={{ fontSize: '1.25rem', margin: "0.6875rem 0" }} >
          Dynamic Ties is a passion project created by <strong>Jeffrey Ryan</strong>, 
          a data scientist who studied classical percussion and engineering at Northwestern University.
          While conducting research in a social network analysis lab, he realized that the same techniques could offer valuable insights when applied to orchestras and their performers.
        </p>
        <p className="text-base leading-relaxed" style={{ fontSize: '1.25rem' }}>
          In early 2024, a prototype focusing on just the Big 5 orchestras was built with help from <strong>Samarth Arul</strong> and <strong>Jonathan Zhang</strong>.
          A year later, Jeffrey decided to continue the project--significantly upscaling to include 30+ orchestras, using the database to uncover new insights, and turning the results into a public resource.
        </p>
      </div>

      <h2 className="text-xl font-semibold" style={{ fontSize: '1.5625rem' }}>Sourcing the data</h2>
      <div style={{ height: "2.5px", backgroundColor: "#2d5fff", width: "100%", margin: "0.3125rem 0"}} />
      <p className="text-base leading-relaxed" style={{ fontSize: '1.25rem', margin: "0.6875rem 0" }} >
        Dynamic Ties was built by pulling biographies from the websites of 32 major US orchestras. 
        In particular, the goal was to compile data on who played in each orchestra,
        what instrument(s) they play, where they went to school, and who they studied under.
      </p>
      <p className="text-base leading-relaxed" style={{ fontSize: '1.25rem' }}>
        This approach does have a few major limitations. At the base level, not every performing orchestral 
        musician has a bio on their orchestra's website--nor do these bios list 100% of the information we'd like to study.
        Even if biographies were complete in scope, the way they are written is not standardized. 
        Manually reading and recording this kind of information at scale is too time consuming, so natural language processing techniques
        were used to systematically record these data quickly and accurately. 
        Despite these limitations, a significant amount of useful data has been sourced at around 90% accuracy.
      </p>
      <p className="text-base leading-relaxed" style={{ fontSize: '1.25rem' }}>
        One of the methods of making this data as accurate as possible is performing manual changes based on personal knowledge. 
        If you see a datapoint which should be corrected--either facts are missing or incorrect--feel free to contact us!
      </p>

      <h2 className="text-xl font-semibold" style={{ fontSize: '1.5625rem' }}>Which orchestras are included?</h2>
      <div style={{ height: "2.5px", backgroundColor: "#2d5fff", width: "100%", margin: "0.3125rem 0"}} />
      <p className="text-base leading-relaxed" style={{ fontSize: '1.25rem', margin: "0.6875rem 0" }} >
        The orchestras in the dataset are: Alabama Symphony Orchestra, Arkansas Symphony, Atlanta Symphony Orchestra, Austin Symphony Orchestra, Baltimore Symphony Orchestra, Buffalo Philharmonic Orchestra, Boston Symphony Orchestra, Cincinnati Symphony Orchestra, The Cleveland Orchestra, Colorado Symphony, Chicago Symphony Orchestra, Detroit Symphony Orchestra, Dallas Symphony Orchestra, Houston Symphony, Indianapolis Symphony Orchestra, Kansas City Symphony, Los Angeles Philharmonic, Louisville Orchestra, Minnesota Orchestra, Milwaukee Symphony, Nashville Symphony, New Jersey Symphony, National Symphony Orchestra, New York Philharmonic, Oregon Symphony, The Philadelphia Orchestra, Pittsburgh Symphony, Rochester Philharmonic Orchestra, Seattle Symphony, San Francisco Symphony, St. Louis Symphony Orchestra, and Utah Symphony. 
        These ensembles were chosen roughly by a combination of prestige and budget, but are not based on any strict criterion. The data were pulled in April of 2025.
      </p>

      <h2 className="text-xl font-semibold" style={{ fontSize: '1.5625rem' }}>Contact us</h2>
      <div style={{ height: "2.5px", backgroundColor: "#2d5fff", width: "100%", margin: "0.3125rem 0"}} />
      <p className="text-base leading-relaxed" style={{ fontSize: '1.25rem', margin: "0.6875rem 0" }} >
        Have any comments, questions, or concerns? Want to collaborate? Have ideas for future research? Reach out anytime.
        <br />
        <span className="block mt-2 font-medium" style={{ fontSize: '1.25rem' }}>Jeffrey Ryan</span>
        <a href="mailto:jcr101402@gmail.com" className="text-blue-600 hover:underline" style={{ fontSize: '1.25rem' }}>jcr101402@gmail.com</a>
      </p>
    </div>
    </Layout>
  );
}
  