import { uiText } from '../data/content'
import { FormEvent, useState } from 'react'
import { useStore } from '../store/useStore'

export function IntroScreen() {
  const enter = useStore((state) => state.enter)
  const setPlayerName = useStore((state) => state.setPlayerName)
  const [name, setName] = useState('')
  const [showNameError, setShowNameError] = useState(false)

  const enterMuseum = (event: FormEvent) => {
    event.preventDefault()
    const normalizedName = name.trim().replace(/\s+/g, ' ').slice(0, 24)
    if (!normalizedName) {
      setShowNameError(true)
      return
    }
    setPlayerName(normalizedName)
    enter()
  }

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

      <form className="intro-actions" onSubmit={enterMuseum}>
        <label className="name-field">
          <span>Tên hiển thị trong bảo tàng</span>
          <input
            autoFocus
            maxLength={24}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setShowNameError(false)
            }}
            placeholder="Nhập tên của bạn"
            aria-invalid={showNameError}
          />
        </label>
        {showNameError && <p className="name-error">Hãy nhập tên trước khi vào bảo tàng.</p>}
        <button className="primary-button" type="submit">
          <span>{uiText.enter}</span><i aria-hidden="true">→</i>
        </button>
        <span className="open-status"><i /> Đang mở cửa · Tham quan tự do</span>
      </form>

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
