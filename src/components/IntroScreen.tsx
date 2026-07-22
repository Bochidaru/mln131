import { uiText } from '../data/content'
import { FormEvent, useState } from 'react'
import { avatars, defaultAvatarId } from '../data/avatars'
import { useStore } from '../store/useStore'

export function IntroScreen() {
  const setPlayerName = useStore((state) => state.setPlayerName)
  const setAvatarId = useStore((state) => state.setAvatarId)
  const beginJoining = useStore((state) => state.beginJoining)
  const joining = useStore((state) => state.joining)
  const joinError = useStore((state) => state.joinError)
  const [name, setName] = useState('')
  const [avatarId, setSelectedAvatarId] = useState(defaultAvatarId)
  const [step, setStep] = useState<'welcome' | 'profile'>('welcome')
  const [showNameError, setShowNameError] = useState(false)

  const enterMuseum = (event: FormEvent) => {
    event.preventDefault()
    const normalizedName = name.trim().replace(/\s+/g, ' ').slice(0, 24)
    if (!normalizedName) {
      setShowNameError(true)
      return
    }
    setPlayerName(normalizedName)
    setAvatarId(avatarId)
    beginJoining()
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
      {step === 'welcome' ? <>
        <p className="intro-subtitle">Hành trình Chủ nghĩa xã hội khoa học</p>
        {joinError && <p className="name-error">{joinError}</p>}
        <p className="intro-deck">{uiText.intro}</p>
        <div className="intro-actions">
          <button className="primary-button" type="button" onClick={() => setStep('profile')}>
            <span>{uiText.enter}</span><i aria-hidden="true">→</i>
          </button>
          <span className="open-status"><i /> Đang mở cửa · Tham quan tự do</span>
        </div>
      </> : <form className="profile-form" onSubmit={enterMuseum}>
        <button className="back-button" type="button" onClick={() => setStep('welcome')}>← Quay lại</button>
        <p className="intro-subtitle">Chọn danh tính tham quan</p>
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
        <fieldset className="avatar-picker" disabled={joining}>
          <legend>Chọn nhân vật</legend>
          <div>
            {avatars.map((avatar) => <button key={avatar.id} type="button" className={`avatar-option ${avatar.id === avatarId ? 'is-selected' : ''}`} onClick={() => setSelectedAvatarId(avatar.id)}>
              <b style={{ '--avatar-suit': avatar.suit, '--avatar-accent': avatar.accent } as React.CSSProperties}>{avatar.icon}</b>
              <span>{avatar.name}<small>{avatar.description}</small></span>
            </button>)}
          </div>
        </fieldset>
        {(showNameError || joinError) && <p className="name-error">{joinError ?? 'Hãy nhập tên trước khi vào bảo tàng.'}</p>}
        <button className="primary-button" type="submit" disabled={joining}>
          <span>{joining ? 'Đang kiểm tra tên…' : 'Vào bảo tàng'}</span><i aria-hidden="true">→</i>
        </button>
      </form>}

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
