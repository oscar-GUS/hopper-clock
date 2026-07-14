import React from 'react'
import { createRoot } from 'react-dom/client'
import RelojHoppers from './RelojHoppers'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RelojHoppers />
  </React.StrictMode>,
)
