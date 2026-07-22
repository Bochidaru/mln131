import { useEffect, type CSSProperties } from 'react'
import { ultimateSkills } from '../data/skills'
import { useStore } from '../store/useStore'

export function SkillShop() {
  const open = useStore((state) => state.skillShopOpen)
  const score = useStore((state) => state.score)
  const owned = useStore((state) => state.ownedUltimateSkills)
  const equipped = useStore((state) => state.equippedUltimateSkillId)
  const notice = useStore((state) => state.skillNotice)
  const setOpen = useStore((state) => state.setSkillShopOpen)
  const purchase = useStore((state) => state.purchaseSkill)
  const equip = useStore((state) => state.equipSkill)

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.code === 'Escape') setOpen(false)
    }
    addEventListener('keydown', close)
    return () => removeEventListener('keydown', close)
  }, [open, setOpen])

  if (!open) return null

  return <div className="skill-shop-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) setOpen(false)
  }}>
    <section className="skill-shop" role="dialog" aria-modal="true" aria-labelledby="skill-shop-title">
      <header>
        <div><small>TRỤ NĂNG LỰC · SẢNH CHÍNH</small><h2 id="skill-shop-title">Kho Kỹ Năng Duel</h2></div>
        <div className="skill-shop-balance"><span>Số dư</span><strong>{score} điểm</strong></div>
        <button className="skill-shop-close" onClick={() => setOpen(false)} aria-label="Đóng cửa hàng">×</button>
      </header>
      <p className="skill-shop-intro">Q và E luôn miễn phí. Chọn một ultimate cho phím R; kỹ năng đã mua được giữ tới khi bạn ngắt kết nối.</p>
      <div className="skill-grid">
        {ultimateSkills.map((skill, index) => {
          const isOwned = owned.includes(skill.id)
          const isEquipped = equipped === skill.id
          const canAfford = score >= skill.price
          return <article key={skill.id} className={isEquipped ? 'is-equipped' : ''} style={{ '--skill-accent': skill.accent } as CSSProperties}>
            <div className="skill-card-top"><span>R{String(index + 1).padStart(2, '0')}</span><i>{skill.price === 0 ? 'MẶC ĐỊNH' : `${skill.price} ĐIỂM`}</i></div>
            <h3>{skill.name}</h3>
            <p>{skill.description}</p>
            <dl><div><dt>Hiệu lực</dt><dd>{skill.duration}</dd></div><div><dt>Hồi chiêu</dt><dd>{skill.cooldown}s</dd></div></dl>
            {isEquipped
              ? <button disabled>Đang trang bị</button>
              : isOwned
                ? <button onClick={() => equip(skill.id)}>Trang bị</button>
                : <button disabled={!canAfford} onClick={() => purchase(skill.id)}>{canAfford ? `Mua · ${skill.price} điểm` : `Thiếu ${skill.price - score} điểm`}</button>}
          </article>
        })}
      </div>
      {notice && <p className="skill-shop-notice" role="status">{notice}</p>}
      <footer><span><kbd>Q</kbd> Siêu nhảy · 10s</span><span><kbd>E</kbd> Dash · 10s</span><span><kbd>R</kbd> Ultimate · 30s</span></footer>
    </section>
  </div>
}
