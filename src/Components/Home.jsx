import React from "react";
import Navbar from "./Navbar";
import "./Home.css";

const Home = () => {
  return (
    <>
      
      <div className="home-container">
        <Navbar />
        <h1>Welcome to the Home Page</h1>
        <p>This is the content of your homepage.</p>
      </div>
    </>
  );
};

export default Home;
