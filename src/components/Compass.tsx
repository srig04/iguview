import { useStore } from '../store'

export function Compass() {
  const azimuth = useStore(s => s.cameraAzimuth)
  // Negate: when camera is NE of building, N needle should point upper-LEFT
  // atan2(dx,dz) = +45° for camera at [55,38,55] → rotate -45° so N goes upper-left ✓
  const rotateDeg = -(azimuth * 180 / Math.PI)

  const size = 96
  const cx   = size / 2
  const arm  = 30

  return (
    <div style={{
      position: 'absolute', bottom: 28, left: 28,
      width: size, height: size,
      background: 'rgba(15,23,42,0.82)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(148,163,184,0.18)',
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      <svg width={size} height={size} style={{ transform: `rotate(${rotateDeg}deg)`, transition: 'transform 0.08s linear' }}>

        {/* Outer ring */}
        <circle cx={cx} cy={cx} r={44} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={1} />

        {/* 8 tick marks */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45) * Math.PI / 180
          const r1 = 38, r2 = 44
          return (
            <line key={i}
              x1={cx + r1 * Math.sin(a)} y1={cx - r1 * Math.cos(a)}
              x2={cx + r2 * Math.sin(a)} y2={cx - r2 * Math.cos(a)}
              stroke="rgba(148,163,184,0.25)" strokeWidth={1}
            />
          )
        })}

        {/* N needle (red, points up = north) */}
        <polygon
          points={`${cx},${cx - arm} ${cx - 5},${cx + 5} ${cx + 5},${cx + 5}`}
          fill="#ef4444" opacity={0.95}
        />
        {/* S needle (grey, points down) */}
        <polygon
          points={`${cx},${cx + arm} ${cx - 4},${cx - 4} ${cx + 4},${cx - 4}`}
          fill="#475569" opacity={0.7}
        />

        {/* Cardinal labels (rotated against the compass so they stay readable) */}
        {[
          { l: 'N', angle: 0,   color: '#fca5a5', size: 11 },
          { l: 'E', angle: 90,  color: '#94a3b8', size:  9 },
          { l: 'S', angle: 180, color: '#94a3b8', size:  9 },
          { l: 'W', angle: 270, color: '#94a3b8', size:  9 },
        ].map(({ l, angle, color, size: fs }) => {
          const rad = angle * Math.PI / 180
          const r   = 34
          const tx  = cx + r * Math.sin(rad)
          const ty  = cx - r * Math.cos(rad)
          return (
            <text key={l} x={tx} y={ty}
              textAnchor="middle" dominantBaseline="middle"
              fill={color} fontSize={fs} fontWeight={l === 'N' ? 700 : 500}
              fontFamily="system-ui, sans-serif"
              transform={`rotate(${-rotateDeg}, ${tx}, ${ty})`}
            >
              {l}
            </text>
          )
        })}

        {/* Centre dot */}
        <circle cx={cx} cy={cx} r={3.5} fill="#e2e8f0" />
      </svg>
    </div>
  )
}
