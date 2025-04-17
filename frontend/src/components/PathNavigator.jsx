// src/components/PathNavigator.jsx
import React from 'react';

const PathNavigator = ({ currentPath, fetchFiles }) => {
  // Function to normalize path (ensure it starts with / and has no double slashes)
  const normalizePath = (path) => {
    if (!path) return '/';
    // Ensure path starts with /
    const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
    // Remove any double slashes
    return withLeadingSlash.replace(/\/+/g, '/');
  };

  // Function to render the breadcrumb navigation
  const renderBreadcrumbs = () => {
    const normalizedPath = normalizePath(currentPath);
    
    // If we're at root, just show the root slash
    if (normalizedPath === '/') {
      return (
        <div className="breadcrumb-container">
          <span className="breadcrumb-current">/</span>
        </div>
      );
    }
    
    // Get path segments (remove empty segments)
    const segments = normalizedPath.split('/').filter(Boolean);
    
    // Create breadcrumb items with proper navigation
    return (
      <div className="breadcrumb-container">
        {/* Root path */}
        <span className="breadcrumb-link" onClick={() => fetchFiles('/')}>
          /
        </span>
        
        {/* Path segments */}
        {segments.map((segment, index) => {
          // Build the path for this segment
          const segmentPath = '/' + segments.slice(0, index + 1).join('/');
          
          return (
            <React.Fragment key={index}>
              {/* Each segment gets a separator and then the segment name */}
              {index > 0 && <span className="breadcrumb-separator">/</span>}
              
              <span 
                className={index === segments.length - 1 ? "breadcrumb-current" : "breadcrumb-link"}
                onClick={() => index < segments.length - 1 && fetchFiles(segmentPath)}
              >
                {segment}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="path-navigator">
      {renderBreadcrumbs()}
    </div>
  );
};

export default PathNavigator;