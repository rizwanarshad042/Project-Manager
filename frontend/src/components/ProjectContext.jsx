import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequestWithAuth } from '../utils/apiUtils';

const ProjectContext = createContext();

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const refreshProjects = async () => {
    console.log('Global refreshProjects called');
    setIsLoading(true);
    try {
      // Clear any cached data first
      setProjects([]);
      
      // Clear browser cache for this specific endpoint
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
          }
          console.log('Browser cache cleared');
        } catch (cacheErr) {
          console.log('Could not clear browser cache:', cacheErr);
        }
      }
      
      // Fetch fresh data from backend with cache-busting
      console.log('Fetching fresh projects from backend...');
      const timestamp = new Date().getTime();
      const freshProjects = await apiRequestWithAuth(`/projects?t=${timestamp}`, {}, navigate);
      console.log('Refreshed projects data from backend:', freshProjects);
      console.log('Number of projects received:', freshProjects.length);

      // Set the fresh projects
      setProjects(freshProjects);
      console.log('Global projects state updated with fresh data');
    } catch (err) {
      console.error('Error refreshing projects:', err);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (pid) => {
    console.log('Global deleteProject called with pid:', pid);
    
    if (!window.confirm("Are you sure you want to delete this project?")) {
      console.log('User cancelled deletion');
      return;
    }

    try {
      console.log('Attempting to delete project with ID:', pid);
      const response = await apiRequestWithAuth(`/users/projects/${pid}`, {
        method: 'DELETE'
      }, navigate);
      
      console.log('Delete API response:', response);

      // Clear all cached data immediately
      console.log('Clearing all cached data...');
      setProjects([]);
      setIsLoading(true);
      
      // Clear any potential cached data in session storage
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('project') || key.includes('cache') || key.includes('data'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log('Removing cached data:', key);
        sessionStorage.removeItem(key);
      });
      
      // Wait a moment for the backend to process the deletion
      console.log('Waiting for backend to process deletion...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a complete refresh from the database
      console.log('Forcing complete refresh from database...');
      await refreshProjects();
      
      alert('Project deleted successfully');
      console.log('Project deletion completed successfully');
    } catch (err) {
      console.error('Error deleting project:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        pid: pid
      });
      setIsLoading(false);
      if (!err.message.includes('Authentication required')) {
        alert(err.message || 'Failed to delete project. Please try again.');
      }
    }
  };

  // Initial load of projects
  useEffect(() => {
    refreshProjects();
  }, []);

  const value = {
    projects,
    setProjects,
    isLoading,
    refreshProjects,
    deleteProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}; 