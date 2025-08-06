import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Testpage from './Components/Testpage.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'


const route = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
  },
  {
    path:"/test",
    element: <Testpage/>
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={route}/>
  </StrictMode>,
)
