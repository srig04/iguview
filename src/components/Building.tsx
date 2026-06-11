import { useStore } from '../store'
import { IGUPanel } from './IGUPanel'

const HALF = 19
const H    = 17.5   // 5 floors × 3.5
const MID  = H / 2

export function Building() {
  const igus     = useStore(s => s.igus)
  const clearSel = useStore(s => s.clearSelection)

  return (
    <group>
      {/* Main building body */}
      <mesh position={[0, MID, 0]} onClick={e => { e.stopPropagation(); clearSel() }}>
        <boxGeometry args={[HALF * 2, H, HALF * 2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Roof cap */}
      <mesh position={[0, H + 0.4, 0]}>
        <boxGeometry args={[HALF * 2 + 0.6, 0.8, HALF * 2 + 0.6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* Floor plates */}
      {Array.from({ length: 6 }, (_, f) => (
        <mesh key={f} position={[0, f * 3.5, 0]}>
          <boxGeometry args={[HALF * 2 + 0.3, 0.22, HALF * 2 + 0.3]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.8} />
        </mesh>
      ))}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#0a0f1e" roughness={1} />
      </mesh>

      {/* IGU panels — flush on each facade */}
      {igus.map(igu => <IGUPanel key={igu.id} igu={igu} />)}
    </group>
  )
}
