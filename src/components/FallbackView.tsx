import { useState } from 'react'
import { rooms, uiText } from '../data/content'
export function FallbackView() {
  const [open, setOpen] = useState(1)
  return <main className="fallback"><p className="eyebrow">{uiText.eyebrow}</p><h1>{uiText.fallbackTitle}</h1>
    {rooms.slice(1, 8).map((room) => <section key={room.id}><button onClick={() => setOpen(open === room.id ? -1 : room.id)}><span>0{room.id}</span>{room.name}<b>{open === room.id ? '−' : '+'}</b></button>{open === room.id && <div>{room.posters.map((p) => <article key={p.id}><h2>{p.title}</h2><p>{p.summary}</p><ul>{p.keyPoints.map((x) => <li key={x}>{x}</li>)}</ul></article>)}</div>}</section>)}
  </main>
}
