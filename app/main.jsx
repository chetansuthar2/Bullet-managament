import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './page.tsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <page />
  </StrictMode>,
)
