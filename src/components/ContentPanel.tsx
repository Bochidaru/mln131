import { useEffect } from 'react'
import { uiText } from '../data/content'
import { useStore } from '../store/useStore'
export function ContentPanel() {
  const poster = useStore((s) => s.activePoster); const close = useStore((s) => s.closePoster)
  useEffect(() => { const escape = (e: KeyboardEvent) => e.key === 'Escape' && close(); addEventListener('keydown', escape); return () => removeEventListener('keydown', escape) }, [close])
  if (!poster) return null
  return <div className="panel-backdrop" onClick={close} role="presentation">
    <article className="content-panel" onClick={(e) => e.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="panel-title">
      <button className="close-button" onClick={close} aria-label={uiText.close}>×</button>
      <div className="panel-image-wrap"><img src={poster.image} alt="" /></div>
      <div className="panel-copy"><p className="eyebrow">Hồ sơ triển lãm</p><h2 id="panel-title">{poster.title}</h2><p className="summary">{poster.summary}</p>
        <ul>{poster.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
      </div>
    </article>
  </div>
}
