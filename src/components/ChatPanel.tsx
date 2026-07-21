import { FormEvent, useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

export function ChatPanel() {
  const entered = useStore((state) => state.entered)
  const chatOpen = useStore((state) => state.chatOpen)
  const setChatOpen = useStore((state) => state.setChatOpen)
  const messages = useStore((state) => state.chatMessages)
  const playerId = useStore((state) => state.multiplayerPlayerId)
  const queueChat = useStore((state) => state.queueChat)
  const input = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const latestMessageId = messages[messages.length - 1]?.id
  const [expiredMessageId, setExpiredMessageId] = useState<string | undefined>()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!entered || chatOpen || event.key !== 'Enter') return
      event.preventDefault()
      setChatOpen(true)
    }
    addEventListener('keydown', onKeyDown)
    return () => removeEventListener('keydown', onKeyDown)
  }, [chatOpen, entered, setChatOpen])

  useEffect(() => {
    if (chatOpen) requestAnimationFrame(() => input.current?.focus())
  }, [chatOpen])

  useEffect(() => {
    if (!latestMessageId) return
    const timer = window.setTimeout(() => setExpiredMessageId(latestMessageId), 3000)
    return () => window.clearTimeout(timer)
  }, [latestMessageId])

  if (!entered) return null
  const showLog = chatOpen || latestMessageId !== expiredMessageId

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim().replace(/\s+/g, ' ').slice(0, 280)
    if (!text) {
      setChatOpen(false)
      return
    }
    queueChat(text)
    setDraft('')
    setChatOpen(false)
  }

  return <section className={`chat-panel ${chatOpen ? 'is-open' : ''}`} aria-label="Trò chuyện">
    {showLog && <div className="chat-log" aria-live="polite">
      {messages.slice(-6).map((message) => <p key={message.id} className={message.playerId === playerId ? 'is-self' : ''}><b>{message.playerId === playerId ? 'Bạn' : message.name}</b><span>{message.text}</span></p>)}
    </div>}
    {chatOpen ? <form onSubmit={submit}><input ref={input} maxLength={280} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nhập tin nhắn rồi nhấn Enter…" /></form> : <button onClick={() => setChatOpen(true)}><kbd>ENTER</kbd> Trò chuyện</button>}
  </section>
}
