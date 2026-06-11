import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, getTint, getZoneEffectiveTint } from '../store'
import type { IGU } from '../types'

const TINTED_COLOR   = new THREE.Color('#0a0f1e')
const CLEAR_COLOR    = new THREE.Color('#93c5fd')
const SELECTED_COLOR = new THREE.Color('#fde68a')
const TMP_COLOR      = new THREE.Color()

interface Props { igu: IGU }

export function IGUPanel({ igu }: Props) {
  const meshRef   = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  // Only subscribe to what drives interactivity (selection, zone membership)
  const selectedIds  = useStore(s => s.selectedIds)
  const toggleSelect = useStore(s => s.toggleSelect)

  const isSelected = selectedIds.includes(igu.id)

  // ── All tint logic runs inside useFrame using getState() ──────────────────
  // This guarantees freshness every frame without stale-closure issues.
  useFrame(() => {
    if (!meshRef.current) return
    const { tintLookup, hour, month, igus, zones } = useStore.getState()

    // Latest igu (penetrationDepth may have changed via zone update)
    const liveIgu = igus.find(i => i.id === igu.id) ?? igu

    const zone = liveIgu.zoneId ? zones.find(z => z.id === liveIgu.zoneId) : null

    // Effective tint: zone schedule/energy-mode/worst-case, or plain ML lookup if unzoned
    const effectiveTint: 0 | 1 = zone
      ? getZoneEffectiveTint(tintLookup, zone, igus, hour, month)
      : getTint(tintLookup, liveIgu.direction, hour, month, liveIgu.penetrationDepth)

    const mat = meshRef.current.material as THREE.MeshStandardMaterial

    let target: THREE.Color
    if (isSelected) {
      target = SELECTED_COLOR
    } else if (effectiveTint === 1) {
      target = zone ? TMP_COLOR.set(zone.color).lerp(TINTED_COLOR, 0.9) : TINTED_COLOR
    } else {
      target = zone ? TMP_COLOR.set(zone.color).lerp(CLEAR_COLOR, 0.65) : CLEAR_COLOR
    }

    mat.color.lerp(target, 0.18)
    mat.opacity           = effectiveTint === 1 ? 0.96 : 0.72
    mat.emissiveIntensity = isSelected ? 0.6 : hovered ? 0.2 : 0
    mat.emissive.set(isSelected ? '#fde68a' : hovered ? '#7dd3fc' : '#000000')
  })

  return (
    <mesh
      ref={meshRef}
      position={igu.position}
      rotation={igu.rotation as [number, number, number]}
      onClick={e => { e.stopPropagation(); toggleSelect(igu.id) }}
      onPointerOver={e => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer' }}
      onPointerOut={e  => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default' }}
    >
      <boxGeometry args={[4.2, 2.85, 0.07]} />
      <meshStandardMaterial
        color={CLEAR_COLOR}
        transparent
        opacity={0.72}
        roughness={0.05}
        metalness={0.15}
      />
    </mesh>
  )
}
