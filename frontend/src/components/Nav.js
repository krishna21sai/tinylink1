import React from "react";

function Nav() {
  return (
    <header className="nav-root">
      <div className="nav-inner">
        <div className="nav-left">
          <span className="nav-logo">TinyLink</span>
        </div>
        <nav className="nav-right">
          <a href="/" className="nav-link">
            Dashboard
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Nav;
