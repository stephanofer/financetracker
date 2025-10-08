// src/App.tsx

import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
import honoLogo from "./assets/hono.svg";
import "./App.css";

interface Comment {
  id: number;
  author: string;
  content: string;
}

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("unknown");
  const [comments, setComments] = useState<Comment[]>([]);

  const loadComments = () => {
    console.log("asd");
    fetch("/api/")
      .then((res) => res.json() as Promise<Comment[]>)
      .then((data) => setComments(data))
      .catch((error) => console.error("Error loading comments:", error));
  };
 
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://hono.dev/" target="_blank">
          <img src={honoLogo} className="logo cloudflare" alt="Hono logo" />
        </a>
        <a href="https://workers.cloudflare.com/" target="_blank">
          <img
            src={cloudflareLogo}
            className="logo cloudflare"
            alt="Cloudflare logo"
          />
        </a>
      </div>
      <h1>Vite + React + Hono + Cloudflare</h1>
      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          aria-label="increment"
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="card">
        <button
          onClick={() => {
            fetch("/api/")
              .then((res) => res.json() as Promise<{ name: string }>)
              .then((data) => setName(data.name));
          }}
          aria-label="get name"
        >
          Name from API is: {name}
        </button>
        <p>
          Edit <code>worker/index.ts</code> to change the name
        </p>
      </div>
      
      <div className="card">
        <h2>Comments</h2>
        <button
          onClick={loadComments}
          aria-label="load comments"
        >
          Load Comments
        </button>
        
        {comments.length > 0 && (
          <div style={{ marginTop: "20px", textAlign: "left" }}>
            {comments.map((comment) => (
              <div 
                key={comment.id} 
                style={{ 
                  padding: "10px", 
                  margin: "10px 0", 
                  border: "1px solid #ccc", 
                  borderRadius: "5px" 
                }}
              >
                <strong>{comment.author}:</strong>
                <p style={{ margin: "5px 0 0 0" }}>{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <p className="read-the-docs">Click on the logos to learn more</p>
    </>
  );
}

export default App;
