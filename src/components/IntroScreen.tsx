import { uiText } from '../data/content'
import { useStore } from '../store/useStore'
export function IntroScreen() {
  const enter = useStore((s) => s.enter)
  return <main className="intro">
    <div className="intro-grid" aria-hidden="true" />
    <div className="red-wedge" aria-hidden="true" />
    <section className="intro-copy">
      <p className="eyebrow">{uiText.eyebrow}</p>
      <h1>{uiText.title.split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
      <p className="intro-deck">{uiText.intro}</p>
      <button className="primary-button" onClick={enter}>{uiText.enter}<span aria-hidden="true">↗</span></button>
      <p className="instructions">{uiText.instructions}</p>
    </section>
    <p className="edition">01 — 09<br />TRIỂN LÃM SỐ</p>
  </main>
}
