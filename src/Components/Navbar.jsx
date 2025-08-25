import React from "react";
import { AppBar, Toolbar, Button, Typography, Box } from "@mui/material";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <AppBar position="static" className="navbar">
      <Toolbar>
        <Typography variant="h6" className="navbar-title">
          SM Design Floors
        </Typography>

        <Box>
          <Button component={Link} to="/" className="navbar-link">
            Home
          </Button>
          <Button component={Link} to="/contact-us" className="navbar-link">
            Contact Us
          </Button>
          <Button component={Link} to="/gallery" className="navbar-link">
            Gallery
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
