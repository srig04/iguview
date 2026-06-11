import { useState } from 'react'
import { useStore, getZoneEffectiveTint, getSunPosition, SITES } from '../store'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function ControlPanel() {
  const hour       = useStore(s => s.hour)
  const month      = useStore(s => s.month)
  const selectedIds = useStore(s => s.selectedIds)
  const zones      = useStore(s => s.zones)
  const igus       = useStore(s => s.igus)
  const tintLookup = useStore(s => s.tintLookup)
  const currentSiteId = useStore(s => s.currentSiteId)
  const setSite    = useStore(s => s.setSite)
  const setHour    = useStore(s => s.setHour)
  const setMonth   = useStore(s => s.setMonth)
  const createZone = useStore(s => s.createZone)
  const updateZonePenetration = useStore(s => s.updateZonePenetration)
  const ungroupZone = useStore(s => s.ungroupZone)
  const clearSelection = useStore(s => s.clearSelection)
  const cycleScheduleHour = useStore(s => s.cycleScheduleHour)
  const toggleZoneEnergyMode = useStore(s => s.toggleZoneEnergyMode)
  const toggleZoneOccupied = useStore(s => s.toggleZoneOccupied)

  const { altitude, azimuth: sunAz } = getSunPosition(tintLookup, month, hour)
  const isDaytime = altitude > 0
  const sunLabel = !isDaytime ? 'Below horizon'
    : altitude < 10  ? 'Near horizon'
    : altitude < 30  ? 'Low sun'
    : altitude < 55  ? 'Mid sky'
    : 'High overhead'

  const [newZoneName,  setNewZoneName]  = useState('')
  const [newZoneDepth, setNewZoneDepth] = useState(3)
  const [showForm,     setShowForm]     = useState(false)

  const fmt = (h: number) => {
    const s = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:00 ${s}`
  }

  // Compute zone tint (schedule override > energy mode > worst-case of member IGUs)
  const getZoneTint = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId)
    if (!zone) return 0
    return getZoneEffectiveTint(tintLookup, zone, igus, hour, month)
  }

  const selectedHaveZone = selectedIds.some(id => igus.find(i => i.id === id)?.zoneId)

  return (
    <div style={{
      position:'absolute', top:0, right:0, width:320, height:'100vh',
      background:'rgba(15,23,42,0.95)', backdropFilter:'blur(12px)',
      padding:'24px 20px', overflowY:'auto',
      display:'flex', flexDirection:'column', gap:22,
      borderLeft:'1px solid rgba(148,163,184,0.1)',
      fontFamily:'system-ui,-apple-system,sans-serif', color:'#e2e8f0',
    }}>

      {/* Header */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:'#64748b', textTransform:'uppercase' }}>
          IGU Intelligence
        </div>
        <div style={{ fontSize:22, fontWeight:700, marginTop:4, color:'#f1f5f9' }}>
          Tint Simulator
        </div>
      </div>

      {/* Site selector */}
      <div>
        <label style={lbl}>Site</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:5, marginTop:8 }}>
          {SITES.map(site => (
            <button key={site.id} onClick={() => setSite(site.id)} style={{
              padding:'7px 4px', borderRadius:7, fontSize:12, cursor:'pointer',
              border:`1px solid ${currentSiteId === site.id ? '#3b82f6' : 'rgba(148,163,184,0.15)'}`,
              background: currentSiteId === site.id ? '#3b82f6' : 'rgba(51,65,85,0.5)',
              color: currentSiteId === site.id ? '#fff' : '#94a3b8',
              fontWeight: currentSiteId === site.id ? 700 : 400,
            }}>{site.name}</button>
          ))}
        </div>
      </div>

      {/* Month selector */}
      <div>
        <label style={lbl}>Month</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, marginTop:8 }}>
          {MONTHS.map((m, i) => {
            const mn = i + 1
            return (
              <button key={mn} onClick={() => setMonth(mn)} style={{
                padding:'7px 4px', borderRadius:7, fontSize:12, cursor:'pointer',
                border:`1px solid ${month === mn ? '#3b82f6' : 'rgba(148,163,184,0.15)'}`,
                background: month === mn ? '#3b82f6' : 'rgba(51,65,85,0.5)',
                color: month === mn ? '#fff' : '#94a3b8',
                fontWeight: month === mn ? 700 : 400,
              }}>{m}</button>
            )
          })}
        </div>
      </div>

      {/* Time slider */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <label style={lbl}>Time of Day</label>
          <span style={{ fontSize:18, fontWeight:700, color:'#38bdf8' }}>{fmt(hour)}</span>
        </div>
        <input type="range" min={0} max={23} value={hour}
          onChange={e => setHour(Number(e.target.value))}
          style={{ width:'100%', marginTop:10, accentColor:'#38bdf8', cursor:'pointer' }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginTop:4 }}>
          <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
        </div>
      </div>

      {/* Sun position card */}
      <div style={{ background:'rgba(30,41,59,0.7)', border:'1px solid rgba(148,163,184,0.1)', borderRadius:10, padding:'12px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:'#64748b', textTransform:'uppercase' }}>Sun Position</span>
          <span style={{ fontSize:11, color: isDaytime ? '#fbbf24' : '#475569', fontWeight:600 }}>
            {isDaytime ? '☀️' : '🌙'} {sunLabel}
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { label:'Altitude', value: isDaytime ? `${altitude.toFixed(1)}°` : 'Night', note:'above horizon' },
            { label:'Azimuth',  value: isDaytime ? `${sunAz.toFixed(1)}°`  : '—',     note:'from North' },
          ].map(item => (
            <div key={item.label} style={{ background:'rgba(15,23,42,0.5)', borderRadius:7, padding:'8px 10px' }}>
              <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:1 }}>{item.label}</div>
              <div style={{ fontSize:16, fontWeight:700, color: isDaytime ? '#38bdf8' : '#334155', marginTop:2 }}>{item.value}</div>
              <div style={{ fontSize:10, color:'#334155' }}>{item.note}</div>
            </div>
          ))}
        </div>
        {isDaytime && altitude > 50 && (
          <div style={{ marginTop:8, fontSize:11, color:'#64748b', lineHeight:1.5, borderTop:'1px solid rgba(148,163,184,0.08)', paddingTop:8 }}>
            💡 High sun ({altitude.toFixed(0)}°) — rays barely enter south windows at depth &gt;1 ft. Try <strong style={{color:'#38bdf8'}}>depth 0–1</strong> or switch to a winter month to see S tinting.
          </div>
        )}
      </div>

      {/* Selection */}
      {selectedIds.length > 0 && (
        <div style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.25)', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#fbbf24' }}>
            {selectedIds.length} IGU{selectedIds.length > 1 ? 's' : ''} selected
          </div>
          <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>
            {selectedIds.slice(0,4).join('  ')} {selectedIds.length > 4 ? `+${selectedIds.length - 4} more` : ''}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            {!selectedHaveZone && (
              <button onClick={() => setShowForm(true)} style={{ ...abtn, background:'#3b82f6' }}>
                Create Zone
              </button>
            )}
            <button onClick={clearSelection} style={{ ...abtn, background:'rgba(100,116,139,0.4)' }}>Clear</button>
          </div>

          {showForm && (
            <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:10 }}>
              <input value={newZoneName} onChange={e => setNewZoneName(e.target.value)}
                placeholder="Zone name…" style={inp} autoFocus />
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#94a3b8' }}>
                  <span>Penetration Depth</span>
                  <span style={{ color:'#38bdf8', fontWeight:600 }}>{newZoneDepth} ft</span>
                </div>
                <input type="range" min={0} max={7} value={newZoneDepth}
                  onChange={e => setNewZoneDepth(Number(e.target.value))}
                  style={{ width:'100%', marginTop:6, accentColor:'#38bdf8' }} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { createZone(newZoneName.trim(), newZoneDepth); setNewZoneName(''); setShowForm(false) }}
                  style={{ ...abtn, background:'#10b981', flex:1 }}>✓ Create</button>
                <button onClick={() => setShowForm(false)} style={{ ...abtn, background:'rgba(100,116,139,0.4)' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zones */}
      {zones.length > 0 && (
        <div>
          <label style={lbl}>Zones ({zones.length})</label>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:10 }}>
            {zones.map(zone => {
              const zt = getZoneTint(zone.id)
              return (
                <div key={zone.id} style={{ background:'rgba(30,41,59,0.8)', border:`1px solid ${zone.color}44`, borderRadius:10, padding:'14px 14px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:zone.color }} />
                      <span style={{ fontWeight:600, fontSize:14 }}>{zone.name}</span>
                    </div>
                    <div style={{
                      fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99,
                      background: zt === 1 ? 'rgba(15,23,42,0.9)' : 'rgba(125,211,252,0.12)',
                      color: zt === 1 ? '#64748b' : '#38bdf8',
                      border: `1px solid ${zt === 1 ? '#1e293b' : '#38bdf833'}`,
                    }}>
                      {zt === 1 ? '⬛ TINTED' : '🔲 CLEAR'}
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'#475569', marginTop:5 }}>
                    {zone.iguIds.length} IGUs · Depth: {zone.penetrationDepth} ft
                  </div>
                  <div style={{ marginTop:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b' }}>
                      <span>Penetration Depth</span>
                      <span style={{ color:'#38bdf8' }}>{zone.penetrationDepth} ft</span>
                    </div>
                    <input type="range" min={0} max={7} value={zone.penetrationDepth}
                      onChange={e => updateZonePenetration(zone.id, Number(e.target.value))}
                      style={{ width:'100%', marginTop:4, accentColor:zone.color }} />
                  </div>

                  {/* Schedule grid */}
                  <div style={{ marginTop:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b', marginBottom:5 }}>
                      <span>Schedule</span>
                      <span style={{ color:'#475569' }}>click hour to override</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(24,1fr)', gap:1 }}>
                      {zone.schedule.map((slot, h) => (
                        <div key={h}
                          onClick={() => cycleScheduleHour(zone.id, h)}
                          title={`${h}:00 — ${slot}`}
                          style={{
                            height:16, cursor:'pointer', borderRadius:2,
                            background: slot === 'clear' ? '#7dd3fc' : slot === 'tinted' ? '#0f172a' : 'rgba(100,116,139,0.25)',
                            border: h === hour ? '1px solid #fbbf24' : '1px solid transparent',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Energy mode */}
                  <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, color:'#64748b' }}>Energy Mode</span>
                    <button onClick={() => toggleZoneEnergyMode(zone.id)} style={{
                      ...abtn, padding:'4px 10px', fontSize:11,
                      background: zone.energyModeEnabled ? '#10b981' : 'rgba(100,116,139,0.4)',
                    }}>
                      {zone.energyModeEnabled ? 'Energy Saver' : 'Auto'}
                    </button>
                  </div>
                  {zone.energyModeEnabled && (
                    <>
                      <div style={{ marginTop:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:11, color:'#64748b' }}>Occupancy</span>
                        <button onClick={() => toggleZoneOccupied(zone.id)} style={{
                          ...abtn, padding:'4px 10px', fontSize:11,
                          background: zone.occupied ? '#3b82f6' : 'rgba(100,116,139,0.4)',
                          color: zone.occupied ? '#fff' : '#cbd5e1',
                        }}>
                          {zone.occupied ? '🟢 Occupied' : '⚪ Vacant'}
                        </button>
                      </div>
                      {!zone.occupied && [12,1,2].includes(month) && (
                        <div style={{ marginTop:6, fontSize:11, color:'#64748b', lineHeight:1.5 }}>
                          💡 Vacant + Winter — staying clear for free solar heat gain.
                        </div>
                      )}
                      {!zone.occupied && [6,7,8].includes(month) && (
                        <div style={{ marginTop:6, fontSize:11, color:'#64748b', lineHeight:1.5 }}>
                          💡 Vacant + Summer — staying tinted to cut cooling load.
                        </div>
                      )}
                    </>
                  )}

                  <button onClick={() => ungroupZone(zone.id)} style={{
                    ...abtn, marginTop:10, width:'100%',
                    background:'rgba(239,68,68,0.12)', color:'#f87171',
                    border:'1px solid rgba(239,68,68,0.2)',
                  }}>Ungroup Zone</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop:'auto', borderTop:'1px solid rgba(148,163,184,0.1)', paddingTop:16 }}>
        <label style={lbl}>Legend</label>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
          {[
            { bg:'#7dd3fc', label:'Clear (Tint 1)',  op:0.65 },
            { bg:'#0f172a', label:'Tinted (Tint 4)', op:1, border:'#334155' },
            { bg:'#fbbf24', label:'Selected',         op:1 },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#94a3b8' }}>
              <div style={{ width:28, height:16, borderRadius:3, background:item.bg, opacity:item.op,
                border:`1px solid ${item.border ?? 'rgba(255,255,255,0.1)'}` }} />
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, fontSize:11, color:'#475569', lineHeight:1.6 }}>
          Click IGUs to select · Shift+click multi-select<br/>
          Model: XGBoost + PVlib · NYC 40.76°N 73.97°W
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize:11, fontWeight:700, letterSpacing:1.5, color:'#64748b', textTransform:'uppercase' }
const abtn: React.CSSProperties = { padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', color:'#fff' }
const inp: React.CSSProperties = { width:'100%', padding:'8px 12px', borderRadius:8, fontSize:13, background:'rgba(51,65,85,0.8)', border:'1px solid rgba(148,163,184,0.2)', color:'#e2e8f0', outline:'none', boxSizing:'border-box' }
