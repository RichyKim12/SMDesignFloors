import Masonry from "react-masonry-css";
import Navbar from "../Navbar";
import "./Gallery.css";
import "../Home.css"
import React, { useState, useEffect } from "react";



const Gallery = () => {
    const [images, setImages] = useState([]);

    useEffect(() => {
        // Import all images from src/assets folder
        const imageFiles = import.meta.glob("../../assets/*.jpg", { eager: true, import: "default" });

        // Convert object to array of URLs
        const imageArray = Object.values(imageFiles);
        setImages(imageArray);
    }, []);
    const breakpointColumnsObj = {
        default: 4,
        1100: 3,
        700: 2,
        500: 1
    };

    return (
        <div className='home-container'>
            <Navbar/>
            <h1>Gallery</h1>
            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="my-masonry-grid"
                columnClassName="my-masonry-grid_column"
            >
                {images.map((src, index) => (
                    <img key={index} src={src} alt={`Gallery ${index}`} />
                ))}
            </Masonry>
        </div>

    );
};

export default Gallery;
