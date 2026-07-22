import { useRef } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { useStore } from '../store/useStore'

export function MobileControls() {
  const mobile = useIsMobile()
  const start = useRef<{ x: number; y: number } | null>(null)
  const lookStart = useRef<{ x: number; y: number } | null>(null)
  const setMove = useStore((state) => state.setMobileMove)
  const setLook = useStore((state) => state.setMobileLook)
  const focused = useStore((state) => state.focusedPoster)
  const active = useStore((state) => state.activePoster)
  const entered = useStore((state) => state.entered)
  const duel = useStore((state) => state.duel)
  const skillShopNearby = useStore((state) => state.skillShopNearby)
  const skillShopOpen = useStore((state) => state.skillShopOpen)

  if (!mobile || active || !entered || duel || skillShopOpen) return null
  const stopMove = () => { start.current = null; setMove({ x: 0, z: 0 }) }
  const stopLook = () => { lookStart.current = null; setLook({ x: 0, y: 0 }) }

  return <div className="mobile-controls">
    <div className="joystick"
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); start.current = { x: event.clientX, y: event.clientY } }}
      onPointerMove={(event) => {
        if (!start.current) return
        setMove({ x: Math.max(-1, Math.min(1, (event.clientX - start.current.x) / 42)), z: Math.max(-1, Math.min(1, (event.clientY - start.current.y) / 42)) })
      }}
      onPointerUp={stopMove} onPointerCancel={stopMove}>
      <span>DI CHUYỂN</span><i />
    </div>
    <div className="look-zone"
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); lookStart.current = { x: event.clientX, y: event.clientY } }}
      onPointerMove={(event) => {
        if (!lookStart.current) return
        setLook({ x: event.clientX - lookStart.current.x, y: event.clientY - lookStart.current.y })
        lookStart.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerUp={stopLook} onPointerCancel={stopLook}><span>VUỐT ĐỂ NHÌN</span>
    </div>
    {skillShopNearby
      ? <button className="mobile-interact" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }))}>Kho kỹ năng</button>
      : focused && <button className="mobile-interact" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }))}>Xem hiện vật</button>}
  </div>
}
