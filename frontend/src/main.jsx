import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PoseEstimationMetrics from './components/pose-estimation-metrics.jsx'


import './index.css'

// import App from './request .jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PoseEstimationMetrics />
  </StrictMode>,
)
