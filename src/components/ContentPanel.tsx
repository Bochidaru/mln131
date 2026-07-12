import { useEffect, useMemo, useRef } from 'react'
import { rooms, uiText } from '../data/content'
import { useStore } from '../store/useStore'

export function ContentPanel() {
  const poster = useStore((state) => state.activePoster)
  const close = useStore((state) => state.closePoster)
  const openPoster = useStore((state) => state.openPoster)
  const closeButton = useRef<HTMLButtonElement>(null)

  const context = useMemo(() => {
    if (!poster) return null
    const room = rooms.find((item) => item.posters.some((candidate) => candidate.id === poster.id))
    if (!room) return null
    const index = room.posters.findIndex((candidate) => candidate.id === poster.id)
    return { room, index, previous: room.posters[(index - 1 + room.posters.length) % room.posters.length], next: room.posters[(index + 1) % room.posters.length] }
  }, [poster])

  useEffect(() => {
    if (!poster) return
    const returnFocus = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft' && context) openPoster(context.previous)
      if (event.key === 'ArrowRight' && context) openPoster(context.next)
    }
    addEventListener('keydown', keyboard)
    return () => {
      removeEventListener('keydown', keyboard)
      returnFocus?.focus?.()
    }
  }, [close, context, openPoster, poster])

  if (!poster || !context) return null
  const { room, index, previous, next } = context

  return <div className="panel-backdrop" onClick={close} role="presentation">
    <article className="content-panel" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="panel-title">
      <header className="panel-header">
        <div className="panel-brand"><span>M</span><strong>Hồ sơ triển lãm</strong></div>
        <button ref={closeButton} className="close-button" onClick={close} aria-label={uiText.close}>×</button>
      </header>

      <div className="panel-layout">
        <figure className="panel-image-wrap">
          <img src={poster.image} alt={`Minh họa cho hiện vật: ${poster.title}`} />
          <figcaption>MLN131 · {poster.id.toUpperCase()}</figcaption>
        </figure>

        <div className="panel-copy">
          <p className="panel-kicker"><span>{room.subtitle}</span> Hiện vật {String(index + 1).padStart(2, '0')} / {String(room.posters.length).padStart(2, '0')}</p>
          <h2 id="panel-title">{poster.title}</h2>
          <p className="summary">{poster.summary}</p>
          <div className="key-points">
            <span>Điểm chính</span>
            <ul>{poster.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
          </div>
        </div>
      </div>

      <footer className="panel-footer">
        <button onClick={() => openPoster(previous)}><i>←</i><span><small>Trước</small>{previous.title}</span></button>
        <button onClick={() => openPoster(next)}><span><small>Tiếp theo</small>{next.title}</span><i>→</i></button>
      </footer>
    </article>
  </div>
}
