import React, { useState } from 'react';
import { FaSearch, FaMicrophone } from 'react-icons/fa';
import '../styles/searchBar.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    // Real-time search as user types
    onSearch(value);
  };

  const handleVoiceSearch = () => {
    // Voice search functionality can be implemented here
    alert('Voice search feature coming soon!');
  };

  return (
    <div className="search-bar-container">
      <div className="search-form">
        <div className="search-input-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search for videos, topics, or creators..."
            value={query}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <button 
            type="button" 
            className="voice-search"
            onClick={handleVoiceSearch}
            aria-label="Voice search"
          >
            <FaMicrophone />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;