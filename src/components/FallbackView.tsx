import { useState } from 'react'
import { rooms, uiText } from '../data/content'
export function FallbackView() {
  const [open, setOpen] = useState(0)
  return <main className="fallback"><p className="eyebrow">{uiText.eyebrow}</p><h1>{uiText.fallbackTitle}</h1>
    {rooms.map((room) => <section key={room.id}><button onClick={() => setOpen(open === room.id ? -1 : room.id)}><span>{String(room.id).padStart(2, '0')}</span>{room.name}<b>{open === room.id ? '−' : '+'}</b></button>{open === room.id && <div>{room.posters.map((p) => <article key={p.id}><img src={p.image} alt="" /><h2>{p.title}</h2><p>{p.summary}</p><ul>{p.keyPoints.map((x) => <li key={x}>{x}</li>)}</ul></article>)}</div>}</section>)}
  </main>
}
