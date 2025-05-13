import React, { useEffect } from 'react';

export default function Layout({ children }) {
  // Check if we're on the explore page by looking at the current pathname
  const isExplorePage = window.location.pathname === '/explore';
  const isExploreNetworkPage = window.location.pathname === '/explore-network';
  const isLandingPage = window.location.pathname === '/';
  const isExploreRelatedPage = isExplorePage || isExploreNetworkPage;
  const shouldBlockScroll = isExploreRelatedPage;
  
  // Add or remove no-scroll class on body
  useEffect(() => {
    if (shouldBlockScroll) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [shouldBlockScroll]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [window.location.pathname]);
  
  return (
    <div style={{
      width: '100%',
      height: shouldBlockScroll ? '100vh' : 'auto',
      overflow: shouldBlockScroll ? 'hidden' : 'auto',
      position: 'relative',
      ...(shouldBlockScroll ? {
        display: 'flex',
        flexDirection: 'column'
      } : {})
    }}>
      <div style={{
        width: '100%',
        maxWidth: isExploreRelatedPage ? '100%' : '1600px',
        transform: isExploreRelatedPage ? 'none' : 'none',
        transformOrigin: 'top center',
        margin: '0 auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: shouldBlockScroll ? '100%' : 'auto',
        overflow: 'visible',
        paddingBottom: shouldBlockScroll ? '0' : '2rem',
        paddingLeft: isExploreRelatedPage ? '0' : '2rem',
        paddingRight: isExploreRelatedPage ? '0' : '2rem'
      }}>
        {children}
      </div>
    </div>
  );
}
  
