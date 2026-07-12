import { uiText } from '../data/content'
import { useStore } from '../store/useStore'

export function IntroScreen() {
  const enter = useStore((state) => state.enter)

  return <main className="intro" aria-label="Giới thiệu Bảo tàng Tri thức MLN131">
    <div className="intro-shade" aria-hidden="true" />
    <header className="intro-brand">
      <span className="brand-mark">M</span>
      <span><strong>MLN131</strong><small>Bảo tàng tri thức</small></span>
    </header>

    <section className="intro-copy">
      <p className="eyebrow">{uiText.eyebrow}</p>
      <h1>{uiText.title.split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
      <p className="intro-subtitle">Hành trình Chủ nghĩa xã hội khoa học</p>
      <p className="intro-deck">{uiText.intro}</p>

      <div className="intro-actions">
        <button className="primary-button" onClick={enter}>
          <span>{uiText.enter}</span><i aria-hidden="true">→</i>
        </button>
        <span className="open-status"><i /> Đang mở cửa · Tham quan tự do</span>
      </div>

      <div className="intro-guide" aria-label="Hướng dẫn điều khiển">
        <span><kbd>W A S D</kbd> Di chuyển</span>
        <span><kbd>CHUỘT</kbd> Quan sát</span>
        <span><kbd>E</kbd> Xem hiện vật</span>
      </div>
    </section>

    <aside className="intro-location">
      <span>VỊ TRÍ HIỆN TẠI</span>
      <strong>Cổng chính</strong>
      <small>Bạn sẽ tự mình bước vào bảo tàng</small>
    </aside>
  </main>
}
