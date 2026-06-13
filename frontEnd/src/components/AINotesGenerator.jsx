import React, { useState } from 'react';
import { FaTimes, FaDownload, FaCopy, FaRobot } from 'react-icons/fa';
import '../styles/AINotesGenerator.css';

const AINotesGenerator = ({ videoTitle, onClose }) => {
  const [notes, setNotes] = useState(`# Summary: ${videoTitle}

## Key Points:
1. Introduction to the main concepts
2. Important formulas and equations
3. Practical applications
4. Common misconceptions
5. Further reading suggestions

## Detailed Explanation:
This video covers the fundamental aspects of ${videoTitle}. The instructor begins by explaining the basic principles and then moves on to more advanced topics.

## Key Takeaways:
- Point 1: Lorem ipsum dolor sit amet
- Point 2: Consectetur adipiscing elit
- Point 3: Sed do eiusmod tempor incididunt`);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateNotes = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notes);
    alert('Notes copied to clipboard!');
  };

  const handleDownloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([notes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `notes-${videoTitle.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="ai-notes-modal">
      <div className="notes-content">
        <div className="notes-header">
          <div className="notes-title">
            <FaRobot className="ai-icon" />
            <h2>AI Generated Notes</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="notes-body">
          <div className="notes-controls">
            <button 
              className={`generate-btn ${isGenerating ? 'generating' : ''}`}
              onClick={handleGenerateNotes}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Regenerate Notes'}
            </button>
          </div>
          
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="notes-textarea"
            rows="15"
            placeholder="AI-generated notes will appear here..."
          />
        </div>
        
        <div className="notes-actions">
          <button className="action-btn copy-btn" onClick={handleCopyNotes}>
            <FaCopy /> Copy Notes
          </button>
          <button className="action-btn download-btn" onClick={handleDownloadNotes}>
            <FaDownload /> Download Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AINotesGenerator;