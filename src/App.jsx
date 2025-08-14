import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ContactUs from './Components/ContactUs'
import { createBrowserRouter,RouterProvider } from 'react-router-dom'

const route = createBrowserRouter([
    {
        path: '/',
        element: <App/>
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
