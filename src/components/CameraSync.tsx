import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../store'

/**
 * Invisible component inside the Canvas that tracks camera azimuth
 * and writes it to the store each frame so the Compass can rotate.
 */
export function CameraSync() {
  const { camera } = useThree()
  const setCameraAzimuth = useStore(s => s.setCameraAzimuth)
  let lastAzimuth = 0

  useFrame(() => {
    // Azimuth = angle of camera around Y axis relative to the target [0,9,0]
    const dx = camera.position.x - 0
    const dz = camera.position.z - 0
    const azimuth = Math.atan2(dx, dz)   // 0 = camera looking from +Z (south)
    // Only update store when it changes meaningfully (throttle to avoid excess renders)
    if (Math.abs(azimuth - lastAzimuth) > 0.005) {
      lastAzimuth = azimuth
      setCameraAzimuth(azimuth)
    }
  })

  return null
}
