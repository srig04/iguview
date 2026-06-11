import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, getSunPosition } from '../store'

// Convert pvlib altitude (°, elevation above horizon) + azimuth (°, clockwise from N)
// → Three.js direction vector (Y=up, +X=East, -Z=North)
function sunDir(altitudeDeg: number, azimuthDeg: number): THREE.Vector3 {
  const alt = (altitudeDeg * Math.PI) / 180
  const az  = (azimuthDeg  * Math.PI) / 180
  return new THREE.Vector3(
    Math.cos(alt) * Math.sin(az),   // East component
    Math.sin(alt),                   // Up component
    -Math.cos(alt) * Math.cos(az),  // North component (-Z = North)
  )
}

export function SkyEnvironment() {
  const tintLookup = useStore(s => s.tintLookup)
  const hour       = useStore(s => s.hour)
  const month      = useStore(s => s.month)
  const sunRef     = useRef<THREE.Mesh>(null!)
  const glowRef    = useRef<THREE.Mesh>(null!)

  const { altitude, azimuth } = getSunPosition(tintLookup, month, hour)
  const isDaytime = altitude > -3   // show sky from a couple degrees below horizon
  const isVisible = altitude > 0    // sun disc only when above horizon

  const dir = sunDir(altitude, azimuth)
  const sunPos = dir.clone().multiplyScalar(150)  // sky dome radius

  // Smoothly animate sun sphere position
  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.position.lerp(sunPos, 0.08)
    }
    if (glowRef.current) {
      glowRef.current.position.lerp(sunPos, 0.08)
    }
  })

  // Sky parameters vary with sun elevation
  const turbidity   = altitude > 15 ? 4 : altitude > 0 ? 8 : 10
  const rayleigh    = altitude > 10 ? 1.5 : altitude > 0 ? 3 : 0.5
  const mieCoeff    = 0.005
  const mieDirectional = altitude > 5 ? 0.7 : 0.85

  // Dawn/dusk colour tint
  const sunColor = altitude > 20
    ? '#fff8f0'  // bright white-yellow
    : altitude > 5
    ? '#fbbf24'  // amber morning/afternoon
    : '#f97316'  // orange at horizon

  return (
    <>
      {/* Physically-based atmosphere */}
      {isDaytime && (
        <Sky
          sunPosition={[dir.x * 100, dir.y * 100, dir.z * 100]}
          turbidity={turbidity}
          rayleigh={rayleigh}
          mieCoefficient={mieCoeff}
          mieDirectionalG={mieDirectional}
          distance={4500}
        />
      )}

      {/* Stars — visible at night, fade at dawn */}
      {altitude < 10 && (
        <Stars
          radius={300}
          depth={60}
          count={altitude < 0 ? 1200 : 400}
          factor={altitude < 0 ? 4 : 2}
          fade
          speed={0}
        />
      )}

      {/* Sun disc */}
      {isVisible && (
        <>
          {/* Glow halo */}
          <mesh ref={glowRef} position={sunPos.toArray()}>
            <sphereGeometry args={[5.5, 16, 16]} />
            <meshBasicMaterial color={sunColor} transparent opacity={0.15} />
          </mesh>
          {/* Core disc */}
          <mesh ref={sunRef} position={sunPos.toArray()}>
            <sphereGeometry args={[2.2, 24, 24]} />
            <meshBasicMaterial color={sunColor} />
          </mesh>
        </>
      )}

      {/* Night: dark background when sky is off */}
      {!isDaytime && (
        <color attach="background" args={['#020617']} />
      )}
    </>
  )
}
