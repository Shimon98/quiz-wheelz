import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'
import App from './app/App.jsx'
import AppProviders from './app/providers/AppProviders.jsx'
import { registerAuthSessionInterceptor } from './api/registerAuthSessionInterceptor.js'

registerAuthSessionInterceptor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
