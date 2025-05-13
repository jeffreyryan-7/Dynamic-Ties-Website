import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Papa from "papaparse";

import Layout from "../components/Layout.jsx";
import musicalTie from "../assets/musical-tie.png";

export default function DatabasePage() {
  const [tieDrawn, setTieDrawn] = useState(false);
  const [titleWidth, setTitleWidth] = useState(0);
  const [titlePosition, setTitlePosition] = useState({ top: 0, left: 0 });
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [filters, setFilters] = useState({});
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState('none');
  const titleRef = useRef(null);
  const dropdownRef = useRef(null);
  const headerRefs = useRef({});

  const rowsPerPage = 100;

  useEffect(() => {
    // Create a temporary span to measure text width
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.fontSize = isMobile ? '24px' : '30px';
    tempSpan.style.fontFamily = 'inherit';
    tempSpan.textContent = 'Dynamic Ties';
    document.body.appendChild(tempSpan);
    
    const width = tempSpan.offsetWidth;
    setTitleWidth(width);
    
    document.body.removeChild(tempSpan);

    const startDelay = setTimeout(() => {
      setTieDrawn(true);
    }, 500);

    // Load CSV
    fetch("/data/frontend_dataview.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data);
            // Initialize filters for each column
            const initialFilters = {};
            Object.keys(results.data[0] || {}).forEach(key => {
              initialFilters[key] = new Set();
            });
            setFilters(initialFilters);
          }
        });
      });

    // Add resize handler for mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(startDelay);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate initial height when dropdown opens
  const calculateDropdownHeight = (headerRect) => {
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - headerRect.bottom;
    return spaceBelow - (3.5 * 16); // Stop 3.5em from bottom
  };

  // Update dropdown position when scrolling
  useEffect(() => {
    const updatePosition = () => {
      if (activeDropdown && headerRefs.current[activeDropdown]) {
        const rect = headerRefs.current[activeDropdown].getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      }
    };

    window.addEventListener('scroll', updatePosition);
    return () => window.removeEventListener('scroll', updatePosition);
  }, [activeDropdown]);

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (column, value, checked) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (checked) {
        newFilters[column].add(value);
      } else {
        newFilters[column].delete(value);
      }
      return newFilters;
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const getFilteredAndSortedData = () => {
    let filteredData = [...data];

    // Apply filters
    Object.entries(filters).forEach(([column, values]) => {
      if (values.size > 0) {
        filteredData = filteredData.filter(row => {
          if (column === 'Education' || column === 'Teachers' || column === 'Instrument') {
            // For list columns, check if any of the items match the filter
            const items = row[column]?.split(',').map(item => item.trim().replace(/^["']|["']$/g, '')) || [];
            return items.some(item => values.has(item));
          }
          return values.has(row[column]);
        });
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle empty values
        if (!aValue && !bValue) return 0;
        if (!aValue) return 1;  // Move empty values to end
        if (!bValue) return -1; // Move empty values to end

        if (sortConfig.key === 'Education' || sortConfig.key === 'Teachers' || sortConfig.key === 'Instrument') {
          // For list columns, sort by the first item in the list
          const aItems = aValue.split(',').map(i => i.trim().replace(/^["']|["']$/g, '')) || [];
          const bItems = bValue.split(',').map(i => i.trim().replace(/^["']|["']$/g, '')) || [];
          const aFirst = aItems[0] || '';
          const bFirst = bItems[0] || '';
          if (aFirst < bFirst) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aFirst > bFirst) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }

        // For other columns
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  };

  const getUniqueValues = (column) => {
    if (column === 'Education' || column === 'Teachers' || column === 'Instrument') {
      // For list columns, get unique values from all arrays
      const uniqueValues = new Set();
      data.forEach(row => {
        if (row[column]) {
          const items = row[column].split(',').map(i => i.trim().replace(/^["']|["']$/g, ''));
          items.forEach(item => uniqueValues.add(item));
        }
      });
      return Array.from(uniqueValues).sort();
    }
    return [...new Set(data.map(row => row[column]))].sort();
  };

  const getSortedFilterValues = (column) => {
    const values = getUniqueValues(column);
    const activeFilters = filters[column] || new Set();
    
    // Split into active, inactive, and empty values
    const active = values.filter(v => activeFilters.has(v) && v !== '');
    const inactive = values.filter(v => !activeFilters.has(v) && v !== '');
    const empty = values.filter(v => v === '');
    
    return [...active, ...inactive, ...empty];
  };

  const filteredAndSortedData = getFilteredAndSortedData();
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredAndSortedData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

  const handlePageChange = (direction) => {
    setCurrentPage((prev) => {
      if (direction === "next" && prev < totalPages) return prev + 1;
      if (direction === "prev" && prev > 1) return prev - 1;
      return prev;
    });
  };

  const getSortIndicator = (column) => {
    if (sortConfig.key !== column) return '▼';
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  const getFilterIcon = (column) => {
    const hasActiveFilters = filters[column]?.size > 0;
    const isSorted = sortConfig.key === column;
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginLeft: '8px',
        position: 'relative'
      }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',         // Rounded corners
            padding: '6px',              // Space around the icon
            display: 'inline-flex',      // Keeps size minimal
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)', // Optional shadow for button look
            cursor: 'pointer'            // Makes it feel clickable
          }}
        >
          <svg  
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="#2d5fff"
            stroke="#2d5fff" 
            strokeWidth="2"
            style={{
              transition: 'fill 0.2s ease'
            }}
          >
            <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        {hasActiveFilters && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '+3px',
            width: '8px',
            height: '8px',
            backgroundColor: "#2d5fff" ,
            borderRadius: '50%'
          }} />
        )}
      </div>
    );
  };

  const handleDropdownOpen = (col) => {
    setActiveDropdown(col);
    setIsLoadingFilters(true);
    
    // Calculate initial height and position
    if (headerRefs.current[col]) {
      const rect = headerRefs.current[col].getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      setDropdownMaxHeight(`${calculateDropdownHeight(rect)}px`);
    }

    // Use setTimeout to ensure the loading state is visible
    setTimeout(() => {
      setIsLoadingFilters(false);
    }, 100);
  };

  const handleClearFilters = (column) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      newFilters[column] = new Set();
      return newFilters;
    });
  };

  // Fuzzy search function
  const fuzzySearch = (searchTerm, items) => {
    if (!searchTerm) return items;
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => 
      item.toLowerCase().includes(searchLower)
    );
  };

  return (
    <Layout>
      {/* Logo + Title */}
      <div style={{ 
        position: 'absolute',
        top: '50px',
        left: isMobile ? '5%' : '25px',
        zIndex: 1000,
        width: isMobile ? '90%' : 'auto'
      }}>
        <div style={{ position: 'relative' }}>
          <Link 
            to="/" 
            style={{
              position: 'relative',
              display: 'block',
              textDecoration: 'none', 
              color: 'inherit',
              fontSize: isMobile ? '24px' : '30px',
            }}
          >
            <div style={{
              position: 'absolute',
              top: isMobile ? '-20px' : '-25px',
              left: '0',
              width: `${titleWidth}px`,
              opacity: 1,
              clipPath: tieDrawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transition: 'clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
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
            </div>
            <span ref={titleRef}>Dynamic Ties</span>
          </Link>
        </div>
      </div>
      {/* Subheading */}
      <div style={{ 
        marginTop: isMobile ? '6rem' : '4rem',
        padding: isMobile ? '0 5%' : '0'
      }}>
        <h1 className="site-title" style={{ 
          fontSize: isMobile ? '2rem' : '3.125rem',
          textAlign: 'center',
          marginBottom: isMobile ? '2rem' : '1rem'
        }}>View the orchestra database</h1>

        {isMobile ? (
          <>
            <div style={{ 
              height: "2.5px", 
              backgroundColor: "#2d5fff", 
              width: "100%", 
              margin: isMobile ? "1.5rem 0" : "0.3125rem 0" 
            }} />
            <h2 style={{
              textAlign: 'center',
              marginTop: isMobile ? '3rem' : '2rem',
              marginBottom: isMobile ? '1rem' : '1rem',
              fontSize: '1.5rem',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              lineHeight: '1.4'
            }}>
              Open on desktop to view database
            </h2>
            <div style={{
              textAlign: 'center',
              marginTop: '0rem',
              padding: '2rem',
              backgroundColor: 'var(--blue-dark)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              lineHeight: '1.6'
            }}>
              <p style={{ marginBottom: '1.5rem' }}>
                For the best experience viewing our orchestra database, 
                please visit this page on a desktop device.
              </p>
              <p>
                The database includes detailed information about orchestra members, 
                their instruments, and historical data and tools to perform queries that are best viewed on a larger screen.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Data Table Viewer */}
            <div style={{ 
              padding: '50px',
              width: '100%',
              position: 'relative',
              maxWidth: '100vw',
              overflow: 'hidden'
            }}>
              {data.length > 0 ? (
                <div style={{
                  width: '100%',
                  margin: '0 auto',
                  backgroundColor: 'var(--blue-dark)',
                  borderRadius: '0',
                  boxShadow: 'none',
                  padding: '0',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '100%',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    position: 'relative',
                    overflow: 'visible'
                  }}>
                    <div style={{
                      width: '100%',
                      position: 'relative',
                      minWidth: 'fit-content',
                      overflow: 'visible'
                    }}>
                      <table className="min-w-full table-auto border border-gray-300" style={{ 
                        fontSize: '1.25rem',
                        backgroundColor: 'var(--blue-dark)'
                      }}>
                        <thead>
                          <tr className="bg-gray-200"
                              style={{backgroundColor: "#2d5fff"}}>
                            {Object.keys(data[0] || {}).map((col) => (
                              <th 
                                key={col} 
                                ref={el => headerRefs.current[col] = el}
                                className="border px-5 py-1.25 text-center font-bold cursor-pointer hover:bg-blue-600 transition-colors"
                                onClick={(e) => {
                                  if (!dropdownRef.current?.contains(e.target)) {
                                    handleDropdownOpen(col);
                                  }
                                }}
                                style={{
                                  userSelect: 'none',
                                  position: 'relative',
                                  minWidth: '150px',
                                  width: 'auto',
                                  whiteSpace: 'nowrap',
                                  padding: '12px 16px'
                                }}
                              >
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  gap: '8px',
                                  width: '100%'
                                }}>
                                  <span style={{
                                    flex: '1',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {col}
                                  </span>
                                  {getFilterIcon(col)}
                                </div>
                                {activeDropdown === col && (
                                  <div 
                                    ref={dropdownRef}
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: '0',
                                      backgroundColor: 'white',
                                      border: '1px solid #ccc',
                                      borderRadius: '4px',
                                      padding: '12px',
                                      zIndex: 1000,
                                      width: '250px',
                                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                      maxHeight: dropdownMaxHeight,
                                      display: 'flex',
                                      flexDirection: 'column'
                                    }}
                                  >
                                    <div style={{ 
                                      marginBottom: '12px', 
                                      borderBottom: '1px solid #eee', 
                                      paddingBottom: '12px',
                                      flexShrink: 0
                                    }}>
                                      <div style={{ 
                                        fontWeight: 'bold', 
                                        marginBottom: '8px', 
                                        color: '#2d5fff',
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        textAlign: 'left'
                                      }}>
                                        Sort
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <button
                                          onClick={() => handleSort(col, 'ascending')}
                                          style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '1px 8px',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            color: '#2d5fff',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: "18px",
                                            fontWeight: "500"
                                          }}
                                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M7 10l5 5 5-5" />
                                          </svg>
                                          Sort A to Z
                                        </button>
                                        <button
                                          onClick={() => handleSort(col, 'descending')}
                                          style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '1px 8px',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            color: '#2d5fff',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: "18px",
                                            fontWeight: "500"
                                          }}
                                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M7 14l5-5 5 5" />
                                          </svg>
                                          Sort Z to A
                                        </button>
                                      </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                      <div style={{ 
                                        fontWeight: 'bold', 
                                        marginBottom: '8px', 
                                        color: '#2d5fff',
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexShrink: 0
                                      }}>
                                        <span>Filter</span>
                                        {filters[col]?.size > 0 && (
                                          <button
                                            onClick={() => handleClearFilters(col)}
                                            style={{
                                              border: '1px solid #2d5fff',
                                              background: '#f0f4ff',
                                              color: '#2d5fff',
                                              fontSize: '12px',
                                              fontWeight: '600',
                                              cursor: 'pointer',
                                              padding: '4px 12px',
                                              borderRadius: '4px',
                                              transition: 'all 0.2s ease',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                            onMouseOver={(e) => {
                                              e.currentTarget.style.backgroundColor = '#2d5fff';
                                              e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseOut={(e) => {
                                              e.currentTarget.style.backgroundColor = '#f0f4ff';
                                              e.currentTarget.style.color = '#2d5fff';
                                            }}
                                          >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                            Clear all
                                          </button>
                                        )}
                                      </div>
                                      <div style={{
                                        marginBottom: '12px',
                                        position: 'relative',
                                        flexShrink: 0
                                      }}>
                                        <input
                                          type="text"
                                          placeholder="Search..."
                                          value={filterSearch[col] || ''}
                                          onChange={(e) => setFilterSearch(prev => ({
                                            ...prev,
                                            [col]: e.target.value
                                          }))}
                                          style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            paddingLeft: '32px',
                                            border: '1px solid #eee',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            color: '#2d5fff',
                                            outline: 'none',
                                            transition: 'border-color 0.2s ease'
                                          }}
                                          onFocus={(e) => e.target.style.borderColor = '#2d5fff'}
                                          onBlur={(e) => e.target.style.borderColor = '#eee'}
                                        />
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="#2d5fff"
                                          strokeWidth="2"
                                          style={{
                                            position: 'absolute',
                                            left: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none'
                                          }}
                                        >
                                          <circle cx="11" cy="11" r="8" />
                                          <path d="M21 21l-4.35-4.35" />
                                        </svg>
                                        {filterSearch[col] && (
                                          <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            border: '1px solid #eee',
                                            borderRadius: '4px',
                                            marginTop: '4px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            zIndex: 1001,
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                          }}>
                                            {fuzzySearch(filterSearch[col], getUniqueValues(col)).map(value => (
                                              <div
                                                key={value}
                                                onClick={() => {
                                                  handleFilterChange(col, value, !filters[col]?.has(value));
                                                  setFilterSearch(prev => ({ ...prev, [col]: '' }));
                                                }}
                                                style={{
                                                  padding: '8px 12px',
                                                  cursor: 'pointer',
                                                  color: '#2d5fff',
                                                  fontSize: '14px',
                                                  transition: 'background-color 0.2s ease'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                              >
                                                {value}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      {isLoadingFilters ? (
                                        <div style={{
                                          display: 'flex',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          padding: '20px',
                                          border: '1px solid #eee',
                                          borderRadius: '4px',
                                          flex: 1
                                        }}>
                                          <div style={{
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid #f3f3f3',
                                            borderTop: '2px solid #2d5fff',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                          }} className="spinner" />
                                        </div>
                                      ) : (
                                        <div style={{ 
                                          flex: 1,
                                          overflowY: 'auto',
                                          border: '1px solid #eee',
                                          borderRadius: '4px',
                                          padding: '4px',
                                          minHeight: 0
                                        }}>
                                          {getSortedFilterValues(col).map(value => (
                                            <div 
                                              key={value} 
                                              style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                padding: '8px 12px',
                                                borderRadius: '4px',
                                                transition: 'background-color 0.2s ease',
                                                cursor: 'pointer',
                                                backgroundColor: filters[col]?.has(value) ? '#f0f4ff' : 'transparent'
                                              }}
                                              onMouseOver={(e) => !filters[col]?.has(value) && (e.currentTarget.style.backgroundColor = '#f0f4ff')}
                                              onMouseOut={(e) => !filters[col]?.has(value) && (e.currentTarget.style.backgroundColor = 'transparent')}
                                              onClick={() => handleFilterChange(col, value, !filters[col]?.has(value))}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={filters[col]?.has(value)}
                                                onChange={(e) => handleFilterChange(col, value, e.target.checked)}
                                                style={{ 
                                                  marginRight: '8px',
                                                  width: '16px',
                                                  height: '16px',
                                                  accentColor: '#2d5fff',
                                                  flexShrink: 0,
                                                  cursor: 'pointer'
                                                }}
                                              />
                                              <span style={{ 
                                                color: '#2d5fff',
                                                fontSize: '14px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '180px'
                                              }}
                                                title={value}
                                              >
                                                {value}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentRows.length > 0 ? (
                            currentRows.map((row, i) => (
                              <tr key={i}>
                                {Object.values(row).map((val, j) => (
                                  <td key={j} className="border px-5 py-2.5">{val}</td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td 
                                colSpan={Object.keys(data[0] || {}).length} 
                                style={{
                                  textAlign: 'center',
                                  padding: '2rem',
                                  color: 'var(--text-secondary)',
                                  fontStyle: 'italic'
                                }}
                              >
                                No rows match current filters
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '1.25rem' }}>Loading database...</p>
              )}

              {/* Pagination Controls */}
              <div className="mt-5 flex justify-between items-center" style={{
                padding: '0'
              }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange("prev")}
                  className="px-5 py-1.25 text-white rounded disabled:opacity-50"
                  style={{
                    backgroundColor: "#2d5fff", 
                    fontSize: '1.25rem'
                  }}
                >
                  Previous
                </button>
                <span style={{ 
                  fontSize: '1.25rem',
                  textAlign: 'center'
                }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange("next")}
                  className="px-5 py-1.25 text-white rounded disabled:opacity-50"
                  style={{
                    backgroundColor: "#2d5fff", 
                    fontSize: '1.25rem'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

<style>
  {`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .spinner {
      animation: spin 1s linear infinite;
    }
  `}
</style>
