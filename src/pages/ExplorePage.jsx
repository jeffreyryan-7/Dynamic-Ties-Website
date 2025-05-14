import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Link } from 'react-router-dom';
import Layout from "../components/Layout.jsx";
import Fuse from 'fuse.js';
import { FaTrash, FaFilter, FaSearch } from 'react-icons/fa';
import musicalTie from "../assets/musical-tie.png";
import * as d3 from 'd3';

const NodeInfoBox = () => null;

const TestSigmaPage = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [hoverNode, setHoverNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedSubnetwork, setSelectedSubnetwork] = useState(new Set());
  const [sidebarNode, setSidebarNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('query');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const searchContainerRef = useRef(null);
  const graphRef = useRef();
  const [activeQueries, setActiveQueries] = useState([]);
  const [queryType, setQueryType] = useState('instrument');
  const [querySearch, setQuerySearch] = useState('');
  const [queryResults, setQueryResults] = useState([]);
  const [tieDrawn, setTieDrawn] = useState(false);
  const [titleWidth, setTitleWidth] = useState(0);
  const [titlePosition, setTitlePosition] = useState({ top: 0, left: 0 });
  const [isLayoutActive, setIsLayoutActive] = useState(false);
  const titleRef = useRef(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [uniqueInstruments, setUniqueInstruments] = useState(new Set());
  const [useAndLogic, setUseAndLogic] = useState(true);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [displayedNodeCount, setDisplayedNodeCount] = useState(0);
  const [showNetworkTooLargeWarning, setShowNetworkTooLargeWarning] = useState(false);
  const [showEmptyNetworkWarning, setShowEmptyNetworkWarning] = useState(false);
  const [searchableItems, setSearchableItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading network...');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchTimeoutRef = useRef(null);
  const [showFilteredOutPopup, setShowFilteredOutPopup] = useState(false);
  const [filteredOutNode, setFilteredOutNode] = useState(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Initialize Fuse.js for fuzzy search
  const [fuse, setFuse] = useState(null);

  // Add state to track if we should render the graph
  const [shouldRenderGraph, setShouldRenderGraph] = useState(false);

  // Add new state for tracking removing filters
  const [removingFilters, setRemovingFilters] = useState(new Set());

  useEffect(() => {
    // Set loading state immediately
    setIsLoading(true);
    setLoadingMessage('Initializing network...');

    // Fetch the network data
    fetch(import.meta.env.BASE_URL + '/data/network.json')
      .then(response => response.json())
      .then(data => {
        // Transform the data to match ForceGraph format
        const transformedData = {
          nodes: data.nodes.map(node => ({
            ...node,
            color: getNodeColor(node.type)
          })),
          links: data.edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            type: edge.type
          }))
        };
        setGraphData(transformedData);

        // Initialize Fuse.js
        const fuseOptions = {
          keys: ['label'],
          threshold: 0.3,
          includeScore: true
        };
        setFuse(new Fuse(transformedData.nodes, fuseOptions));

        // Set initial filters after a delay
        setTimeout(() => {
          setActiveQueries([
            {
              id: 1,
              type: 'school',
              value: 'Northwestern University'
            },
            {
              id: 2,
              type: 'instrument',
              value: 'violin'
            }
          ]);
        }, 500);
      })
      .catch(error => console.error('Error loading graph data:', error));
  }, []);

  // Separate useEffect for click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only check if we're not clicking the search input itself
      if (searchContainerRef.current && 
          !searchContainerRef.current.contains(event.target) && 
          event.target.tagName !== 'INPUT') {
        setShowDropdown(false);
      }
    };

    // Add listener to the entire document
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add effect to hide title after interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (showTitle) {
        setTimeout(() => {
          setShowTitle(false);
        }, 2000);
      }
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [showTitle]);

  // Add effect to automatically hide title after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array means this runs once on mount

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

  // Add resize handler with debounce
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
        
        if (graphRef.current) {
          // Get current center and zoom
          const center = graphRef.current.center();
          const zoom = graphRef.current.zoom();
          
          // Recenter with smooth transition
          graphRef.current.centerAt(center.x, center.y, 1000);
          // Maintain current zoom level
          graphRef.current.zoom(zoom, 1000);
        }
      }, 150); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Add effect to extract unique instruments when graph data is loaded
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const instruments = new Set();
      graphData.nodes.forEach(node => {
        if (node.type === 'musician') {
          // Debug log to see what we're getting
          console.log('Musician node:', node);
          // Handle both array and string cases for backward compatibility
          if (Array.isArray(node.instrument)) {
            node.instrument.forEach(instr => {
              if (instr) instruments.add(instr);
            });
          } else if (typeof node.instrument === 'string') {
            instruments.add(node.instrument);
          }
        }
      });
      console.log('Unique instruments found:', Array.from(instruments));
      setUniqueInstruments(instruments);
    }
  }, [graphData]);

  // Add effect to extract unique searchable items when graph data is loaded
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const items = new Set();
      
      // Add all instruments
      graphData.nodes.forEach(node => {
        if (node.type === 'musician') {
          if (Array.isArray(node.instrument)) {
            node.instrument.forEach(instr => {
              if (instr) items.add(instr);
            });
          } else if (typeof node.instrument === 'string') {
            items.add(node.instrument);
          }
        }
      });

      // Add all orchestras and schools
      graphData.nodes.forEach(node => {
        if (node.type === 'orchestra' || node.type === 'school') {
          items.add(node.label);
        }
      });

      console.log('Searchable items:', Array.from(items));
      setSearchableItems(items);
    }
  }, [graphData]);

  const getNodeColor = (type) => {
    switch (type) {
      case 'musician':
        return '#3a86ff';  // Blue
      case 'school':
        return '#4ecdc4';  // Green
      case 'orchestra':
        return '#ff6b6b';  // Red
      default:
        return '#95a5a6';  // Gray
    }
  };

  // Add debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 100);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Update handleSearch to use debounced query
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Add effect to handle actual search
  useEffect(() => {
    if (debouncedSearchQuery.length > 0 && fuse) {
      const results = fuse.search(debouncedSearchQuery).slice(0, 5);
      setSearchResults(results.map(result => result.item));
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [debouncedSearchQuery, fuse]);

  const handleResultClick = (node) => {
    if (isNodeFilteredOut(node)) {
      setFilteredOutNode(node);
      setShowFilteredOutPopup(true);
      return;
    }

    setSidebarNode(node);
    setSearchQuery(node.label);
    setShowDropdown(false);

    // Apply sticky selection behavior
    setSelectedNode(node);
    const connectedNodes = getConnectedNodes(node.id);
    setSelectedSubnetwork(connectedNodes);

    // Get the current graph data from ForceGraph
    const currentGraph = graphRef.current.graphData();
    
    // Get positions of the selected node and its connected nodes from the current view
    const positions = [
      { x: node.x, y: node.y },
      ...currentGraph.nodes
        .filter(n => connectedNodes.has(n.id))
        .map(n => ({ x: n.x, y: n.y }))
    ];

    // Calculate the bounding box
    const xCoords = positions.map(p => p.x);
    const yCoords = positions.map(p => p.y);
    
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    
    // Add some padding to the bounding box
    const padding = 50; // Reduced padding for tighter focus
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    
    // Calculate the center of the bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate zoom level based on the bounding box size
    const zoomLevel = Math.min(
      window.innerWidth / width,
      window.innerHeight / height
    ) * 1.2; // Increased multiplier to zoom in more

    // Center the view on the bounding box center with smooth animation
    graphRef.current.centerAt(centerX, centerY, 1000);
    // Set the zoom level with smooth animation
    graphRef.current.zoom(zoomLevel, 1000);
  };

  // Function to get connected nodes
  const getConnectedNodes = useCallback((nodeId) => {
    const connected = new Set();
    graphData.links.forEach(link => {
      if (link.source.id === nodeId) {
        connected.add(link.target.id);
      } else if (link.target.id === nodeId) {
        connected.add(link.source.id);
      }
    });
    return connected;
  }, [graphData]);

  // Update getNodeOpacity to be more performant while keeping the same UX
  const getNodeOpacity = useCallback((node) => {
    if (selectedNode) {
      if (node.id === selectedNode.id) return 1;
      return selectedSubnetwork.has(node.id) ? 1 : 0.1;
    }
    if (!hoverNode) return 1;
    if (node.id === hoverNode.id) return 1;
    
    // Check if node is connected to hovered node - using a more efficient check
    return selectedSubnetwork.has(node.id) ? 1 : 0.1;
  }, [hoverNode, selectedNode, selectedSubnetwork]);

  // Update getLinkOpacity to be more performant while keeping the same UX
  const getLinkOpacity = useCallback((link) => {
    if (selectedNode) {
      return (link.source.id === selectedNode.id || link.target.id === selectedNode.id) ? 1 : 0.08;
    }
    if (!hoverNode) return 0.8;
    return (link.source.id === hoverNode.id || link.target.id === hoverNode.id) ? 1 : 0.08;
  }, [hoverNode, selectedNode]);

  // Update handleNodeClick to remove info box positioning
  const handleNodeClick = useCallback((node, event) => {
    // Only update network selection if clicking directly on the network
    if (event && !event.target.closest('.sidebar-content')) {
      if (selectedNode && selectedNode.id === node.id) {
        // If clicking the same node again, deselect it
        setSelectedNode(null);
        setSelectedSubnetwork(new Set());
        // Reset view
        graphRef.current.zoom(1.5, 1000);
        graphRef.current.centerAt(0, 0, 1000);
      } else {
        setSelectedNode(node);
        const connectedNodes = getConnectedNodes(node.id);
        setSelectedSubnetwork(connectedNodes);

        // Simple fixed zoom and center
        graphRef.current.zoom(2.5, 1000); // Fixed zoom level
        graphRef.current.centerAt(node.x, node.y, 1000); // Center on clicked node
      }
    }
  }, [selectedNode, getConnectedNodes]);

  // Update handleBackgroundClick to clear selection
  const handleBackgroundClick = useCallback((event) => {
    // Only clear network selection if clicking on the network background
    if (event && !event.target.closest('.sidebar-content')) {
      setSelectedNode(null);
      setSelectedSubnetwork(new Set());
      setHoverNode(null);  // Also clear hover state
    }
  }, []);

  const handleLinkClick = useCallback((link) => {
    console.log('Clicked link:', link);
  }, []);

  const handleNodeHover = useCallback((node, prevNode) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Only update hover state if no node is currently selected
    if (!selectedNode) {
      setHoverNode(node);
      if (node) {
        const connectedNodes = getConnectedNodes(node.id);
        setSelectedSubnetwork(connectedNodes);
      } else {
        setSelectedSubnetwork(new Set());
      }
    }
  }, [hoverTimeout, getConnectedNodes, selectedNode]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const activeQueriesRef = useRef([]);
  useEffect(() => {
    activeQueriesRef.current = activeQueries;
  }, [activeQueries]);

  // Update getFilterResults to handle combined search
  const getFilterResults = useCallback(() => {
    const searchTerm = querySearch.toLowerCase();
    const seenItems = new Set(); // Track items we've already added
    
    return Array.from(searchableItems)
      .filter(item => {
        // Skip if we've already seen this item
        if (seenItems.has(item)) return false;
        seenItems.add(item);
        return item.toLowerCase().includes(searchTerm);
      })
      .map(item => {
        // Determine the type based on the item
        let type;
        if (graphData.nodes.some(node => 
          node.type === 'musician' && 
          (Array.isArray(node.instrument) ? node.instrument.includes(item) : node.instrument === item)
        )) {
          type = 'instrument';
        } else if (graphData.nodes.some(node => node.type === 'orchestra' && node.label === item)) {
          type = 'orchestra';
        } else {
          type = 'school';
        }

        return {
          id: item,
          label: item,
          type: type
        };
      });
  }, [querySearch, searchableItems, graphData]);

  // Update applyFilter to use a different ID format for user-added filters
  const applyFilter = (type, value) => {
    const newFilter = {
      id: `user-${Date.now()}`,
      type,
      value
    };
    setActiveQueries(prev => [...prev, newFilter]);
    setQuerySearch('');
    setQueryResults([]);
    // Reset hover and selection states
    setHoverNode(null);
    setSelectedNode(null);
    setSelectedSubnetwork(new Set());
    setSidebarNode(null);
  };

  // Update removeFilter to handle immediate visual feedback
  const removeFilter = (filterId) => {
    // Add filter to removing set immediately
    setRemovingFilters(prev => new Set([...prev, filterId]));
    
    // Set loading state immediately
    setIsLoading(true);
    setLoadingMessage('Updating network...');
    
    // Use requestAnimationFrame to ensure loading state is visible before heavy operations
    requestAnimationFrame(() => {
      // Then remove the filter
      setActiveQueries(prev => prev.filter(q => q.id !== filterId));
      
      // Reset hover and selection states
      setHoverNode(null);
      setSelectedNode(null);
      setSelectedSubnetwork(new Set());
      setSidebarNode(null);
      
      // Recenter the network after a short delay to allow the graph to update
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.centerAt(0, 0, 1000);
          graphRef.current.zoom(1.5, 1000);
        }
      }, 100);

      // Hide loading state and clear removing filter after delay
      setTimeout(() => {
        setIsLoading(false);
        setRemovingFilters(prev => {
          const next = new Set(prev);
          next.delete(filterId);
          return next;
        });
      }, 500);
    });
  };

  // Update getFilteredGraphData to properly handle AND/OR logic
  const getFilteredGraphData = useCallback(() => {
    if (activeQueries.length === 0) {
      return graphData;
    }

    // Separate filters by type
    const instrumentFilters = activeQueries.filter(q => q.type === 'instrument');
    const orchestraFilters = activeQueries.filter(q => q.type === 'orchestra');
    const schoolFilters = activeQueries.filter(q => q.type === 'school');

    // First, determine which nodes should be shown based on filters
    let selectedNodeIds;
    
    if (useAndLogic) {
      // AND mode: 
      selectedNodeIds = new Set(
        graphData.nodes
          .filter(node => {
            if (node.type === 'musician') {
              // Step 1: Check if musician has ALL selected instruments
              if (instrumentFilters.length > 0) {
                const hasAllInstruments = instrumentFilters.every(filter => 
                  Array.isArray(node.instrument)
                    ? node.instrument.includes(filter.value)
                    : node.instrument === filter.value
                );
                if (!hasAllInstruments) return false;
              }

              // Step 2: Check if musician is connected to ALL selected organizations
              if (orchestraFilters.length > 0 || schoolFilters.length > 0) {
                const connectedOrgs = new Set();
                graphData.links.forEach(link => {
                  if (link.source.id === node.id && (link.target.type === 'orchestra' || link.target.type === 'school')) {
                    connectedOrgs.add(link.target.label);
                  } else if (link.target.id === node.id && (link.source.type === 'orchestra' || link.source.type === 'school')) {
                    connectedOrgs.add(link.source.label);
                  }
                });

                const hasAllOrgs = [...orchestraFilters, ...schoolFilters].every(filter => 
                  connectedOrgs.has(filter.value)
                );
                if (!hasAllOrgs) return false;
              }

              return true;
            } else if (node.type === 'orchestra' || node.type === 'school') {
              return false;
            }
            return false;
          })
          .map(node => node.id)
      );
    } else {
      // OR mode
      selectedNodeIds = new Set(
        graphData.nodes
          .filter(node => {
            if (node.type === 'musician') {
              // Check if musician has ANY of the selected instruments
              const hasAnyInstrument = instrumentFilters.some(filter => 
                Array.isArray(node.instrument)
                  ? node.instrument.includes(filter.value)
                  : node.instrument === filter.value
              );

              if (hasAnyInstrument) return true;

              // Get all organizations this musician is connected to
              const connectedOrgs = new Set();
              graphData.links.forEach(link => {
                if (link.source.id === node.id && (link.target.type === 'orchestra' || link.target.type === 'school')) {
                  connectedOrgs.add(link.target.label);
                } else if (link.target.id === node.id && (link.source.type === 'orchestra' || link.source.type === 'school')) {
                  connectedOrgs.add(link.source.label);
                }
              });

              // Check if musician is connected to ANY selected organizations
              const connectedToAnyOrg = [...orchestraFilters, ...schoolFilters].some(filter => 
                connectedOrgs.has(filter.value)
              );

              return connectedToAnyOrg;
            } else if (node.type === 'orchestra' || node.type === 'school') {
              return (node.type === 'orchestra' && orchestraFilters.some(filter => node.label === filter.value)) ||
                     (node.type === 'school' && schoolFilters.some(filter => node.label === filter.value));
            }
            return false;
          })
          .map(node => node.id)
      );
    }

    // Common logic for both AND and OR modes
    const connectedNodeIds = new Set(selectedNodeIds);
    
    // Add all organizations connected to the filtered musicians
    graphData.links.forEach(link => {
      if (selectedNodeIds.has(link.source.id) && (link.target.type === 'orchestra' || link.target.type === 'school')) {
        connectedNodeIds.add(link.target.id);
      }
      if (selectedNodeIds.has(link.target.id) && (link.source.type === 'orchestra' || link.source.type === 'school')) {
        connectedNodeIds.add(link.source.id);
      }
    });

    // Get all nodes in the subnetwork
    const allRelevantNodes = graphData.nodes.filter(node => 
      connectedNodeIds.has(node.id)
    );

    // Get ALL links from the original data between the filtered nodes
    const allRelevantLinks = graphData.links.filter(link => 
      connectedNodeIds.has(link.source.id) && connectedNodeIds.has(link.target.id)
    );

    return {
      nodes: allRelevantNodes,
      links: allRelevantLinks
    };
  }, [graphData, activeQueries, useAndLogic]);

  // Add effect to update displayed node count and check if network is too large
  useEffect(() => {
    const filteredData = getFilteredGraphData();
    const count = filteredData.nodes.length;
    setDisplayedNodeCount(count);
    setShowNetworkTooLargeWarning(count > 500);
  }, [getFilteredGraphData]);

  // Memoize the filtered nodes set
  const filteredNodesSet = useMemo(() => {
    if (activeQueries.length === 0) return new Set();
    const filteredData = getFilteredGraphData();
    return new Set(filteredData.nodes.map(node => node.id));
  }, [activeQueries, getFilteredGraphData]);

  // Update isNodeFilteredOut to use memoized set
  const isNodeFilteredOut = useCallback((node) => {
    if (activeQueries.length === 0) return false;
    return !filteredNodesSet.has(node.id);
  }, [activeQueries.length, filteredNodesSet]);

  // Memoize the filtered data to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    const data = getFilteredGraphData();
    const isTooLarge = data.nodes.length > 300;
    const isEmpty = data.nodes.length === 0;
    return {
      data,
      isTooLarge,
      isEmpty
    };
  }, [getFilteredGraphData]);

  // Update effect to handle size check before rendering
  useEffect(() => {
    setIsLoading(true);
    setLoadingMessage('Processing network...');
    
    // Check size before rendering
    const isTooLarge = filteredData.data.nodes.length > 300;
    const isEmpty = filteredData.data.nodes.length === 0 && activeQueries.length > 0; // Only show empty warning if there are active filters
    setShowNetworkTooLargeWarning(isTooLarge);
    setShowEmptyNetworkWarning(isEmpty);
    setShouldRenderGraph(!isTooLarge && !isEmpty);
    
    // Hide loading after delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [filteredData, activeQueries]);

  // Update nodeCanvasObject to handle sticky selection
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    const isSelected = selectedNode && node.id === selectedNode.id;
    const isHovered = hoverNode && node.id === hoverNode.id;
    ctx.font = `${(isSelected || isHovered) ? 'bold ' : ''}${fontSize}px Sans-Serif`;
  
    const baseSize = 6;
    const size = node.type === 'orchestra' ? baseSize * 1.75 :
                 node.type === 'school' ? baseSize * 1.35 : baseSize;
  
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fill();
  
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color;
    ctx.globalAlpha = getNodeOpacity(node);
    ctx.fill();
  
    const hasFilters = activeQueriesRef.current.length > 0;
    const isSelectedOrConnected = selectedNode && (node.id === selectedNode.id || selectedSubnetwork.has(node.id));
    const isHoveredOrConnected = !selectedNode && hoverNode && (node.id === hoverNode.id || 
      graphData.links.some(link => 
        (link.source.id === node.id && link.target.id === hoverNode.id) ||
        (link.source.id === hoverNode.id && link.target.id === node.id)
      )
    );
  
    // Draw label if zoomed in OR if filters are active OR if node is selected/connected OR if node is hovered/connected
    if (globalScale > 2 || (globalScale > 1.5 && hasFilters) || isSelectedOrConnected || isHoveredOrConnected) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, node.x, node.y + size + 6);
    }
  }, [getNodeOpacity, selectedNode, selectedSubnetwork, hoverNode, graphData]);

  // Add effect to handle layout activation when filters change
  useEffect(() => {
    if (activeQueries.length > 0) {
      // Unfreeze all nodes when filters change
      graphData.nodes.forEach(node => {
        node.fx = null;
        node.fy = null;
      });
      setIsLayoutActive(true);

      // Refreeze nodes after a delay
      const freezeTimeout = setTimeout(() => {
        graphData.nodes.forEach(node => {
          node.fx = node.x;
          node.fy = node.y;
        });
        setIsLayoutActive(false);
      }, 2000); // Allow 2 seconds of active layout

      return () => clearTimeout(freezeTimeout);
    }
  }, [activeQueries, graphData.nodes]);

  // Update the force graph parameters
  const handleEngineStop = useCallback(() => {
    if (!isLayoutActive) {
      // Only freeze nodes if we're not in an active layout phase
      graphData.nodes.forEach(node => {
        node.fx = node.x;
        node.fy = node.y;
      });
    }
  }, [isLayoutActive, graphData.nodes]);

  // Update d3Force configuration
  const configureD3Forces = useCallback((force) => {
    const isFiltered = activeQueries.length > 0;
    
    // Create stable forces that don't change with interaction
    const chargeForce = d3.forceManyBody()
      .strength(node => {
        // Different repulsion based on node type
        if (node.type === 'orchestra') return -200; // Strong repulsion for highly connected orchestras
        if (node.type === 'school') return -100;    // Medium repulsion for schools
        return -30;                                 // Weak repulsion for musicians
      })
      .distanceMax(node => {
        // Different max distance based on node type
        if (node.type === 'orchestra') return 800;  // Longer range for orchestras
        if (node.type === 'school') return 600;     // Medium range for schools
        return 400;                                 // Shorter range for musicians
      })
      .theta(0.95); // High theta for large node count
    
    const centerForce = d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
      .strength(isFiltered ? 1 : 0.02); // Very weak centering for sparse network
    
    const collideForce = d3.forceCollide()
      .radius(node => {
        // Different collision radius based on node type
        if (node.type === 'orchestra') return 40;   // Larger radius for orchestras
        if (node.type === 'school') return 25;      // Medium radius for schools
        return 15;                                  // Smaller radius for musicians
      })
      .strength(node => {
        // Different collision strength based on node type
        if (node.type === 'orchestra') return 0.8;  // Stronger collision for orchestras
        if (node.type === 'school') return 0.5;     // Medium collision for schools
        return 0.3;                                 // Weaker collision for musicians
      })
      .iterations(isFiltered ? 4 : 1); // Fewer iterations for performance

    // Apply the forces
    force.charge = chargeForce;
    force.center = centerForce;
    force.collide = collideForce;

    // Add a stable bounding force
    force.bound = alpha => {
      const maxDistance = Math.min(dimensions.width, dimensions.height) * 
        (isFiltered ? 0.3 : 0.6); // Larger area for sparse network
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      
      graphData.nodes.forEach(node => {
        const dx = node.x - centerX;
        const dy = node.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) {
          const scale = maxDistance / distance;
          node.x = centerX + dx * scale;
          node.y = centerY + dy * scale;
          if (!isLayoutActive) {
            node.vx *= 0.1;
            node.vy *= 0.1;
          }
        }
      });
    };
  }, [dimensions, activeQueries.length, isLayoutActive]);

  // Add resize handler for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
      // Only update sidebar state if we're not in mobile view
      if (!isMobileView) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize sidebar as closed on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // Add effect to handle initial load
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, []);

  // Add this effect to handle bottom sheet state
  useEffect(() => {
    if (isMobile) {
      setIsBottomSheetOpen(isSidebarOpen);
    }
  }, [isSidebarOpen, isMobile]);

  // Add this function to handle bottom sheet toggle
  const toggleBottomSheet = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setIsBottomSheetOpen(!isBottomSheetOpen);
  };

  const handleGenerateNetwork = useCallback(() => {
    // Immediately close popup and show loading for better UX
    setShowFilteredOutPopup(false);
    setIsLoading(true);
    setLoadingMessage('Generating network...');

    // Close sidebar on mobile
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsBottomSheetOpen(false);
    }

    // Use setTimeout to allow UI to update before heavy operations
    setTimeout(() => {
      // 1. Clear all filters and 2. Add new filters based on node type
      const newFilters = [];
      
      if (filteredOutNode.type === 'school') {
        // 2a. Add school filter
        newFilters.push({
          id: `user-${Date.now()}`,
          type: 'school',
          value: filteredOutNode.label
        });
      } else if (filteredOutNode.type === 'orchestra') {
        // 2b. Add orchestra filter
        newFilters.push({
          id: `user-${Date.now()}`,
          type: 'orchestra',
          value: filteredOutNode.label
        });
      } else if (filteredOutNode.type === 'musician') {
        // 2c. Add all associated orchestras and schools
        const connectedOrgs = new Set();
        graphData.links.forEach(link => {
          if (link.source.id === filteredOutNode.id && (link.target.type === 'orchestra' || link.target.type === 'school')) {
            connectedOrgs.add({
              type: link.target.type,
              value: link.target.label
            });
          } else if (link.target.id === filteredOutNode.id && (link.source.type === 'orchestra' || link.source.type === 'school')) {
            connectedOrgs.add({
              type: link.source.type,
              value: link.source.label
            });
          }
        });

        // Add each organization as a filter
        connectedOrgs.forEach(org => {
          newFilters.push({
            id: `user-${Date.now()}-${org.value}`,
            type: org.type,
            value: org.value
          });
        });
      }

      // Set the new filters
      setActiveQueries(newFilters);

      // 3. Set up sticky click for the musician if applicable
      if (filteredOutNode.type === 'musician') {
        setSelectedNode(filteredOutNode);
        const connectedNodes = getConnectedNodes(filteredOutNode.id);
        setSelectedSubnetwork(connectedNodes);
      }

      // 4. Set the sidebar node to show the info
      setSidebarNode(filteredOutNode);

      // Hide loading after network updates
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }, 0);
  }, [filteredOutNode, graphData, getConnectedNodes, isMobile]);

  return (
    <Layout>
      <div style={{ 
        position: 'absolute',
        top: '50px',
        left: '25px',
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        <Link 
          to="/" 
          style={{ 
            textDecoration: 'none', 
            color: 'inherit',
            display: 'block',
            pointerEvents: 'auto'  // Re-enable pointer events for the link
          }}
        >
          <div style={{ position: 'relative' }}>
            <img 
              src={musicalTie} 
              alt=""
              style={{
                position: 'absolute',
                top: '-25px',
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
            <div 
              ref={titleRef}
              style={{ 
                fontSize: '30px',
                display: 'block',
              }}
            >
              Dynamic Ties
            </div>
          </div>
        </Link>
      </div>

      <h1 className="site-title" style={{
        backgroundColor: 'transparent',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        position: 'absolute',
        top: '125px',
        left: isSidebarOpen ? 'calc(50% + 10%)' : '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        fontSize: isMobile ? '3.75rem' : '7.5rem',
        opacity: showTitle ? 1 : 0,
        transition: 'opacity 3s ease-in-out, left 0.3s ease-in-out',
        pointerEvents: showTitle ? 'auto' : 'none',
        width: isMobile ? '90%' : 'auto',
        textAlign: 'center'
      }}>
        Explore the Network
      </h1>

      <div style={{ 
        height: '100vh',
        width: '100vw',
        position: 'relative',
        backgroundColor: 'var(--blue-dark)',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}>
        {/* Mobile Active Filters List */}
        {isMobile && !isSidebarOpen && activeQueries.length > 0 && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#2d5fff',
            color: 'white',
            padding: '8px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            zIndex: 1001,
            maxWidth: '150px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              padding: '0 4px 4px 4px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Active Filters
            </div>
            {activeQueries.map(filter => (
              <div key={filter.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                opacity: removingFilters.has(filter.id) ? 0.3 : 1,
                transition: 'opacity 0.2s ease-out'
              }}>
                <span style={{ 
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100px'
                }}>
                  {filter.value}
                </span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '4px',
                    opacity: 0.8,
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    flexShrink: 0
                  }}
                >
                  <FaTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Loading Wall */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--blue-dark)',
            zIndex: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'opacity 0.3s ease-in-out'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{
                color: 'white',
                fontSize: '18px',
                textAlign: 'center'
              }}>
                {loadingMessage}
              </div>
            </div>
          </div>
        )}

        {/* Error Message - Moved outside graph container */}
        {showNetworkTooLargeWarning && !isLoading && (
          <div style={{
            position: 'absolute',
            top: isMobile ? '30%' : '50%',
            left: isMobile ? '50%' : isSidebarOpen ? '62.5%' : '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            color: '#2d5fff',
            textAlign: 'center',
            maxWidth: '80%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 2
          }}>
            <h2 style={{ marginBottom: '15px', fontSize: '24px', color: '#2d5fff' }}>Network Too Large</h2>
            <p style={{ fontSize: '18px', color: '#2d5fff' }}>
              Please apply additional filters to reduce the network size.
            </p>
          </div>
        )}

        {/* Empty Network Warning */}
        {showEmptyNetworkWarning && !isLoading && (
          <div style={{
            position: 'absolute',
            top: isMobile ? '30%' : '50%',
            left: isMobile ? '50%' : isSidebarOpen ? '62.5%' : '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            color: '#2d5fff',
            textAlign: 'center',
            maxWidth: '80%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 2
          }}>
            <h2 style={{ marginBottom: '15px', fontSize: '24px', color: '#2d5fff' }}>No Matching Nodes</h2>
            <p style={{ fontSize: '18px', color: '#2d5fff' }}>
              No nodes match the current filters. Try adjusting your search criteria.
            </p>
          </div>
        )}

        {/* Graph Container */}
        <div className="force-graph-container" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: dimensions.width,
          height: dimensions.height,
          transition: 'width 0.3s ease-out, height 0.3s ease-out',
          touchAction: 'none',
          zIndex: 1,
          visibility: shouldRenderGraph && !isLoading ? 'visible' : 'hidden'
        }} onClick={() => {
          if (isMobile && isSidebarOpen) {
            setIsSidebarOpen(false);
            setIsBottomSheetOpen(false);
          }
        }}>
          {shouldRenderGraph && (
            <ForceGraph2D
              ref={graphRef}
              graphData={filteredData.data}
              width={dimensions.width}
              height={dimensions.height}
              nodeColor="color"
              linkColor={() => '#F5a5a9'}
              linkWidth={1}
              nodeRelSize={6}
              onNodeClick={(node, event) => {
                if (isMobile && isSidebarOpen) {
                  setIsSidebarOpen(false);
                  setIsBottomSheetOpen(false);
                }
                handleNodeClick(node, event);
              }}
              onBackgroundClick={(event) => {
                if (isMobile && isSidebarOpen) {
                  setIsSidebarOpen(false);
                  setIsBottomSheetOpen(false);
                }
                handleBackgroundClick(event);
              }}
              onLinkClick={handleLinkClick}
              onNodeHover={handleNodeHover}
              cooldownTicks={isLayoutActive ? 60 : 45}
              onEngineStop={handleEngineStop}
              onNodeDragEnd={node => {
                if (!isLayoutActive) {
                  node.fx = node.x;
                  node.fy = node.y;
                }
              }}
              d3AlphaDecay={isLayoutActive ? 0.03 : 0.06}
              d3VelocityDecay={isLayoutActive ? 0.4 : 0.6}
              d3Force={configureD3Forces}
              d3ForceLinkDistance={link => {
                const sourceType = link.source.type;
                const targetType = link.target.type;
                
                if (sourceType === 'orchestra' || targetType === 'orchestra') return 200;
                if (sourceType === 'school' || targetType === 'school') return 150;
                return 100;
              }}
              d3ForceLinkStrength={link => {
                const sourceType = link.source.type;
                const targetType = link.target.type;
                
                if (sourceType === 'orchestra' || targetType === 'orchestra') return 0.3;
                if (sourceType === 'school' || targetType === 'school') return 0.2;
                return 0.1;
              }}
              d3ForceCenter={true}
              d3ForceCenterStrength={30}
              d3ForceCollide={true}
              d3ForceCollideRadius={25}
              d3ForceCollideStrength={0.8}
              nodeCanvasObject={nodeCanvasObject}
              nodePointerAreaPaint={(node, color, ctx) => {
                const baseSize = 6;
                const size = node.type === 'orchestra' ? baseSize * 4 :
                             node.type === 'school' ? baseSize * 3.25 : baseSize;
              
                // Use exact node size for hover area
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                ctx.fill();
              }}
              linkCanvasObject={(link, ctx, globalScale) => {
                ctx.beginPath();
                ctx.moveTo(link.source.x, link.source.y);
                ctx.lineTo(link.target.x, link.target.y);
                ctx.strokeStyle = '#95a5a6';
                ctx.globalAlpha = getLinkOpacity(link);
                ctx.stroke();
              }}
              enableNodeDrag={true}
              enablePointerInteraction={true}
              warmupTicks={0}
              minZoom={0.1}
              maxZoom={4}
              onZoom={null}
              onNodeDrag={null}
              onNodeDragStart={null}
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1,
                transform: isSidebarOpen ? 'translateX(12.5%)' : 'none',
                transition: 'transform 0.3s ease-in-out',
                touchAction: 'none'
              }}
            />
          )}
        </div>

        {/* Mobile Bottom Button */}
        {isMobile && !isSidebarOpen && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={toggleBottomSheet}
              style={{
                backgroundColor: '#2d5fff',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '90px',
                height: '90px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <FaFilter size={24} />
                <span style={{ 
                  fontSize: '30px',
                  color: 'white',
                  opacity: 1
                }}>/</span>
                <FaSearch size={24} />
              </div>
            </button>
          </div>
        )}

        {/* Sidebar - Moved outside the graph container */}
        <div style={{
          position: 'fixed',
          top: isMobile ? (isSidebarOpen ? '50vh' : '100vh') : '100px',
          left: '0',
          height: isMobile ? '50vh' : 'calc(100vh - 100px)',
          width: isMobile ? '100%' : (isSidebarOpen ? '25%' : '0'),
          transition: isInitialLoad ? 'none' : 'all 0.3s ease-in-out',
          backgroundColor: '#2d5fff',
          boxShadow: isSidebarOpen ? '0 -2px 5px rgba(0, 0, 0, 0.1)' : 'none',
          zIndex: 1000,
          overflow: 'hidden',
          transform: isMobile ? 'none' : 'none',
          pointerEvents: 'auto',
          visibility: isMobile ? (isSidebarOpen ? 'visible' : 'hidden') : 'visible',
          borderTopLeftRadius: isMobile ? '20px' : '0',
          borderTopRightRadius: isMobile ? '20px' : '20px'
        }}>
          {/* Sidebar Content */}
          <div style={{
            padding: '20px',
            width: '100%',
            height: '100%',
            opacity: isSidebarOpen ? 1 : 0,
            transition: isInitialLoad ? 'none' : 'opacity 0.2s ease-in-out',
            visibility: isSidebarOpen ? 'visible' : 'hidden',
            backgroundColor: '#2d5fff',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1001,
            overflowY: 'auto',
            pointerEvents: 'auto'
          }}>
            {/* Tab Headers */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '20px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
              paddingBottom: '10px'
            }}>
              <button
                onClick={() => setActiveTab('query')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: activeTab === 'query' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  padding: '5px 15px',
                  opacity: activeTab === 'query' ? 1 : 0.7,
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Filter
              </button>
              <button
                onClick={() => setActiveTab('search')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: activeTab === 'search' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  padding: '5px 15px',
                  opacity: activeTab === 'search' ? 1 : 0.7,
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Search
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {activeTab === 'search' ? (
                <div style={{ flex: 1 }}>
                  <div style={{
                    marginBottom: '20px',
                    position: 'relative'
                  }} ref={searchContainerRef}>
                    <input
                      type="text"
                      placeholder="Search instruments, orchestras, or schools..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      style={{
                        width: '100%',
                        padding: '15px 18.75px',
                        fontSize: '20px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        color: '#333',
                        outline: 'none'
                      }}
                    />
                    {showDropdown && searchResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0 0 4px 4px',
                        marginTop: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 1000
                      }}>
                        {searchResults.map((item, index) => {
                          const isFiltered = isNodeFilteredOut(item);
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleResultClick(item)}
                              style={{
                                padding: '10px 15px',
                                cursor: 'pointer',
                                borderBottom: index < searchResults.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                                color: '#333',
                                position: 'relative'
                              }}
                            >
                              <div style={{ 
                                fontWeight: 'bold'
                              }}>
                                {item.label}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#666',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <span>{item.type}</span>
                                {isFiltered && (
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    fontStyle: 'italic',
                                    marginLeft: '8px'
                                  }}>
                                    (filtered out)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="sidebar-content" style={{ 
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px'
                  }}>
                    {sidebarNode ? (
                      <div>
                        <p style={{ margin: '5px 0' }}><strong>Name:</strong> {sidebarNode.label}</p>
                        <p style={{ margin: '5px 0' }}><strong>Node type:</strong> {sidebarNode.type}</p>
                        
                        {sidebarNode.type === 'musician' && (
                          <>
                            <p style={{ margin: '5px 0' }}>
                              <strong>Instrument{sidebarNode.instrument && Array.isArray(sidebarNode.instrument) ? 's' : ''}:</strong>{' '}
                              {sidebarNode.instrument ? (
                                Array.isArray(sidebarNode.instrument) 
                                  ? sidebarNode.instrument.join(', ')
                                  : sidebarNode.instrument
                              ) : 'N/A'}
                            </p>
                            
                            {/* Affiliated Orchestras */}
                            <div style={{ marginTop: '10px' }}>
                              <strong style={{ color: 'white' }}>Orchestra:</strong>
                              <ul style={{ 
                                listStyle: 'none', 
                                padding: 0, 
                                margin: '5px 0',
                                color: 'rgba(255, 255, 255, 0.9)'
                              }}>
                                {graphData.links
                                  .filter(link => 
                                    (link.source.id === sidebarNode.id && link.target.type === 'orchestra') ||
                                    (link.target.id === sidebarNode.id && link.source.type === 'orchestra')
                                  )
                                  .map(link => {
                                    const orchestra = link.source.type === 'orchestra' ? link.source : link.target;
                                    return (
                                      <li key={orchestra.id} style={{ margin: '3px 0' }}>
                                        {orchestra.label}
                                      </li>
                                    );
                                  })}
                              </ul>
                            </div>

                            {/* Affiliated Schools */}
                            <div style={{ marginTop: '10px' }}>
                              <strong style={{ color: 'white' }}>Education:</strong>
                              <ul style={{ 
                                listStyle: 'none', 
                                padding: 0, 
                                margin: '5px 0',
                                color: 'rgba(255, 255, 255, 0.9)'
                              }}>
                                {graphData.links
                                  .filter(link => 
                                    (link.source.id === sidebarNode.id && link.target.type === 'school') ||
                                    (link.target.id === sidebarNode.id && link.source.type === 'school')
                                  )
                                  .map(link => {
                                    const school = link.source.type === 'school' ? link.source : link.target;
                                    return (
                                      <li key={school.id} style={{ margin: '3px 0' }}>
                                        {school.label}
                                      </li>
                                    );
                                  })}
                              </ul>
                            </div>

                            {/* Connected Musicians */}
                            <div style={{ marginTop: '10px' }}>
                              <strong style={{ color: 'white' }}>Connections:</strong>
                              <ul style={{ 
                                listStyle: 'none', 
                                padding: 0, 
                                margin: '5px 0',
                                color: 'rgba(255, 255, 255, 0.9)'
                              }}>
                                {(() => {
                                  // Find all links where the selected musician is connected to another musician
                                  const musicianLinks = graphData.links.filter(link => 
                                    (link.source.id === sidebarNode.id && link.target.type === 'musician') ||
                                    (link.target.id === sidebarNode.id && link.source.type === 'musician')
                                  );

                                  // Create a set of all musician IDs from both ends of these links
                                  const connectedMusicianIds = new Set();
                                  musicianLinks.forEach(link => {
                                    if (link.source.type === 'musician') connectedMusicianIds.add(link.source.id);
                                    if (link.target.type === 'musician') connectedMusicianIds.add(link.target.id);
                                  });

                                  // Remove the selected musician from the set
                                  connectedMusicianIds.delete(sidebarNode.id);

                                  // Convert IDs to musician nodes and render
                                  return Array.from(connectedMusicianIds).map(musicianId => {
                                    const musician = graphData.nodes.find(node => node.id === musicianId);
                                    return (
                                      <li key={musician.id} style={{ margin: '3px 0' }}>
                                        {musician.label}
                                      </li>
                                    );
                                  });
                                })()}
                              </ul>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p style={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px',
                        textAlign: 'center',
                        margin: '20px 0'
                      }}>
                        Find specific musicians, schools, or orchestras
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <div className="sidebar-content" style={{ 
                    padding: '15px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <h3 style={{ fontSize: '16px', color: 'white', margin: 0 }}>Add filters</h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ 
                          color: 'white', 
                          fontSize: '14px',
                          opacity: useAndLogic ? 1 : 0.5
                        }}>
                          AND
                        </span>
                        <label style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '40px',
                          height: '20px'
                        }}>
                          <input
                            type="checkbox"
                            checked={!useAndLogic}
                            onChange={() => setUseAndLogic(!useAndLogic)}
                            style={{
                              opacity: 0,
                              width: 0,
                              height: 0
                            }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: useAndLogic ? '#4CAF50' : '#2196F3',
                            transition: '.4s',
                            borderRadius: '20px'
                          }}>
                            <span style={{
                              position: 'absolute',
                              content: '""',
                              height: '16px',
                              width: '16px',
                              left: '2px',
                              bottom: '2px',
                              backgroundColor: 'white',
                              transition: '.4s',
                              borderRadius: '50%',
                              transform: useAndLogic ? 'translateX(0)' : 'translateX(20px)'
                            }} />
                          </span>
                        </label>
                        <span style={{ 
                          color: 'white', 
                          fontSize: '14px',
                          opacity: !useAndLogic ? 1 : 0.5
                        }}>
                          OR
                        </span>
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search instruments, orchestras, or schools..."
                        value={querySearch}
                        onChange={(e) => {
                          setQuerySearch(e.target.value);
                          setQueryResults(getFilterResults());
                        }}
                        onFocus={(e) => e.target.select()}
                        style={{
                          width: '100%',
                          padding: '12.5px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'white',
                          color: '#333',
                          fontSize: '20px'
                        }}
                      />
                      {querySearch && queryResults.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '0 0 4px 4px',
                          marginTop: 0,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          zIndex: 1000
                        }}>
                          {queryResults.map((item, index) => (
                            <div
                              key={item.id}
                              onClick={() => applyFilter(item.type, item.label)}
                              style={{
                                padding: '10px 15px',
                                cursor: 'pointer',
                                borderBottom: index < queryResults.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                                color: '#333'
                              }}
                            >
                              <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#666',
                                textTransform: 'capitalize'
                              }}>
                                {item.type}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Active Filters in Sidebar */}
                    {activeQueries.length > 0 && (
                      <div style={{ marginTop: '20px' }}>
                        <h4 style={{ 
                          fontSize: '14px', 
                          marginBottom: '10px', 
                          color: 'white',
                          opacity: 0.8
                        }}>Active Filters</h4>
                        {activeQueries.map(filter => (
                          <div key={filter.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                            padding: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '4px',
                            opacity: removingFilters.has(filter.id) ? 0.3 : 1,
                            transition: 'opacity 0.2s ease-out'
                          }}>
                            <span style={{ color: 'white' }}>{filter.value}</span>
                            <button
                              onClick={() => removeFilter(filter.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: 0.8,
                                outline: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                WebkitTouchCallout: 'none',
                                WebkitUserSelect: 'none',
                                userSelect: 'none'
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Node Types Section - Always visible */}
              <div style={{
                borderTop: '2px solid rgba(255, 255, 255, 0.2)',
                paddingTop: '15px',
                marginTop: '20px'
              }}>
                <h3 style={{ 
                  fontSize: '22.5px',
                  marginBottom: '18.75px',
                  color: 'white',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Node Types</h3>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12.5px' }}>
                    <div style={{ width: '15px', height: '15px', backgroundColor: '#ff6b6b', borderRadius: '50%', marginRight: '10px' }}></div>
                    <span style={{ fontWeight: '500', fontSize: '17.5px' }}>Orchestras</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12.5px' }}>
                    <div style={{ width: '15px', height: '15px', backgroundColor: '#4ecdc4', borderRadius: '50%', marginRight: '10px' }}></div>
                    <span style={{ fontWeight: '500', fontSize: '17.5px' }}>Schools</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '15px', height: '15px', backgroundColor: '#2978b5', borderRadius: '50%', marginRight: '10px' }}></div>
                    <span style={{ fontWeight: '500', fontSize: '17.5px' }}>Musicians</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtered Out Popup */}
        {showFilteredOutPopup && filteredOutNode && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              position: 'relative',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <button
                onClick={() => setShowFilteredOutPopup(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
                {filteredOutNode.label} is filtered out
              </h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Would you like to generate a network for that node?
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  onClick={handleGenerateNetwork}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#2d5fff',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowFilteredOutPopup(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </Layout>
  );
};

export default TestSigmaPage;

