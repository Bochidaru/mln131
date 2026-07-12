import { lazy, Suspense, useMemo } from 'react'
import { FallbackView } from './components/FallbackView'
import { IntroScreen } from './components/IntroScreen'
import { useStore } from './store/useStore'

const MuseumScene = lazy(() => import('./components/MuseumScene').then((module) => ({ default: module.MuseumScene })))

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const entered = useStore((state) => state.entered)
  const webgl = useMemo(() => supportsWebGL(), [])

  if (!webgl) return <FallbackView />

  return <>
    <Suspense fallback={<div className="app-loading"><span>MLN131</span><p>Đang chuẩn bị không gian bảo tàng…</p></div>}>
      <MuseumScene />
    </Suspense>
    {!entered && <IntroScreen />}
  </>
}
