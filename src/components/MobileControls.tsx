import { useRef } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { useStore } from '../store/useStore'
export function MobileControls() {
  const mobile = useIsMobile(); const start = useRef<{ x: number; y: number } | null>(null)
  const lookStart = useRef<{ x: number; y: number } | null>(null)
  const setMove = useStore((s) => s.setMobileMove); const setLook = useStore((s) => s.setMobileLook); const active = useStore((s) => s.activePoster)
  if (!mobile || active) return null
  return <div className="mobile-controls">
    <div className="joystick" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = { x: e.clientX, y: e.clientY } }} onPointerMove={(e) => { if (!start.current) return; setMove({ x: Math.max(-1, Math.min(1, (e.clientX - start.current.x) / 40)), z: Math.max(-1, Math.min(1, (e.clientY - start.current.y) / 40)) }) }} onPointerUp={() => { start.current = null; setMove({ x: 0, z: 0 }) }}><i /></div>
    <div className="look-zone" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); lookStart.current = { x: e.clientX, y: e.clientY } }} onPointerMove={(e) => { if (!lookStart.current) return; setLook({ x: (e.clientX - lookStart.current.x) / 18, y: (e.clientY - lookStart.current.y) / 18 }); lookStart.current = { x: e.clientX, y: e.clientY } }} onPointerUp={() => { lookStart.current = null; setLook({ x: 0, y: 0 }) }} onPointerCancel={() => { lookStart.current = null; setLook({ x: 0, y: 0 }) }}><span>VUỐT ĐỂ NHÌN</span></div>
  </div>
}
