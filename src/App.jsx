import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ContactUs from './Components/ContactUs'
import { createBrowserRouter,RouterProvider } from 'react-router-dom'
import Home from './Components/Home.jsx'

const route = createBrowserRouter([
    {
        path: '/',
        element: <Home/>
    },
    {
      path: '/contact-us',
      element: <ContactUs/>
    }
    
])
function App() {

  return (
    <RouterProvider router={route}/>
  )
}

export default App
