// -----------------------------------------------------------------------------
// main.jsx (v0.0.1)
// -----------------------------------------------------------------------------

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/app.scss'
import App from './App.jsx'
import NotificationProvider from './components/NotificationProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider><App /></NotificationProvider>
  </StrictMode>
)
