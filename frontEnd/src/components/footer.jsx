import React from 'react';
import '..styles/footer.css'; // We'll create this CSS file

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          © {currentYear} All rights reserved by <span className="shine-up-text">Shine Up</span>.
        </p>
      </div>
    </footer>
  );
};

export default Footer;