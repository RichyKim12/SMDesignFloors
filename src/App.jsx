import { useState } from 'react'
import './App.css'
import Home from './Components/Home.jsx'
import ContactUs from './Components/ContactUs'
import Gallery from './Components/Frontend/Gallery.jsx'
import { createBrowserRouter,RouterProvider } from 'react-router-dom'


const route = createBrowserRouter([
    {
        path: '/',
        element: <Home/>
    },
    {
      path: '/contact-us',
      element: <ContactUs/>
    },
    {
      path: '/gallery',
      element: <Gallery/>
    }
    
])
function App() {

  return (
    <RouterProvider router={route}/>
  )
}

export default App
