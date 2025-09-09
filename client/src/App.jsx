
import React from "react";
import { Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div className="container">
      <header className="space flex" style={{marginBottom: 16}}>
        <Link to="/" className="title">Realtime Notes</Link>
        <a href="https://socket.io/" target="_blank" rel="noreferrer" className="small">Powered by Socket.IO</a>
      </header>
      <Outlet />
      <footer className="small" style={{marginTop: 20}}>
        No login. Share the Note ID to collaborate.
      </footer>
    </div>
  );
}
