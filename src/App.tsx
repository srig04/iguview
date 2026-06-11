import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Building } from './components/Building'
import { ControlPanel } from './components/ControlPanel'
import { Compass } from './components/Compass'
import { CameraSync } from './components/CameraSync'
import { SkyEnvironment } from './components/SkyEnvironment'
import { useStore, SITES } from './store'
import type { TintLookup } from './types'

export default function App() {
  const setTintLookup = useStore(s => s.setTintLookup)
  const currentSiteId = useStore(s => s.currentSiteId)

  useEffect(() => {
    const site = SITES.find(s => s.id === currentSiteId) ?? SITES[0]
    fetch(site.file)
      .then(r => r.json())
      .then((data: TintLookup) => setTintLookup(data))
      .catch(console.error)
  }, [currentSiteId])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#020617', position: 'relative' }}>

      <div style={{ width: 'calc(100vw - 320px)', height: '100vh' }}>
        <Canvas
          camera={{ position: [55, 38, 55], fov: 42 }}
          shadows
          gl={{ antialias: true }}
        >
          {/* Sky and sun — handles its own background */}
          <SkyEnvironment />

          {/* Ambient — enough to see the building at night */}
          <ambientLight intensity={0.9} />

          {/* Key light tracks sun position roughly */}
          <SunLight />

          {/* Fill from cool north side */}
          <directionalLight position={[-30, 20, -20]} intensity={0.5} color="#bfdbfe" />

          <Building />
          <CameraSync />

          <OrbitControls
            target={[0, 9, 0]}
            minDistance={25}
            maxDistance={160}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>
      </div>

      <ControlPanel />
      <Compass />

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 320,
        padding: '14px 24px',
        background: 'linear-gradient(to bottom, rgba(2,6,23,0.75), transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <div style={{ color: '#e2e8f0', fontFamily: 'system-ui', fontSize: 13 }}>
          <span style={{ color: '#64748b' }}>Site: </span>
          <span style={{ fontWeight: 600 }}>Demo Building — NYC</span>
          <span style={{ color: '#64748b', margin: '0 12px' }}>·</span>
          <span style={{ color: '#64748b' }}>IGUs: </span>
          <span style={{ fontWeight: 600, color: '#38bdf8' }}>140</span>
        </div>
        <div style={{ color: '#475569', fontFamily: 'system-ui', fontSize: 12 }}>
          Orbit · Zoom · Click to select
        </div>
      </div>
    </div>
  )
}

// Separate component so it can read store inside Canvas context
function SunLight() {
  const tintLookup = useStore(s => s.tintLookup)
  const hour       = useStore(s => s.hour)
  const month      = useStore(s => s.month)

  const entry    = tintLookup?.[month]?.['N']?.[hour]?.[0]
  const altitude = entry?.altitude ?? -30
  const azimuth  = entry?.azimuth  ?? 180

  const alt = (altitude * Math.PI) / 180
  const az  = (azimuth  * Math.PI) / 180
  const lx  = Math.cos(alt) * Math.sin(az) * 60
  const ly  = Math.sin(alt) * 60
  const lz  = -Math.cos(alt) * Math.cos(az) * 60

  const intensity = altitude > 0 ? Math.min(2.0, 0.5 + (altitude / 45) * 1.5) : 0
  const color     = altitude > 20 ? '#fff8f0' : altitude > 5 ? '#fde68a' : '#fed7aa'

  return <directionalLight position={[lx, ly, lz]} intensity={intensity} color={color} castShadow />
}
