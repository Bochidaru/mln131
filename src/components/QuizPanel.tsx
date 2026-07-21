import { useState } from 'react'
import { drawQuiz } from '../data/quiz'
import { useStore } from '../store/useStore'

export function QuizPanel() {
  const roomId = useStore((state) => state.quizRoomId)
  const open = useStore((state) => state.quizOpen)
  const setOpen = useStore((state) => state.setQuizOpen)
  const submit = useStore((state) => state.submitQuiz)
  const session = useStore((state) => state.quizSession)
  const result = useStore((state) => state.quizResult)
  const setResult = useStore((state) => state.setQuizResult)

  if (result) return <div className="quiz-backdrop"><section className="quiz-panel quiz-result"><small>KẾT QUẢ QUIZ PHÒNG {result.roomId}</small><h2>Bạn đúng {result.correct}/5 câu</h2><p>+{result.earned} điểm · Tổng: {result.score} điểm</p><button onClick={() => setResult(null)}>Tiếp tục tham quan</button></section></div>
  if (!open || !roomId) return null
  return <div className="quiz-backdrop"><section className="quiz-panel"><button className="quiz-close" onClick={() => setOpen(false)}>×</button><QuizRound key={session} roomId={roomId} submit={submit} /></section></div>
}

function QuizRound({ roomId, submit }: { roomId: number; submit: (roomId: number, correct: number) => void }) {
  const [questions] = useState(() => drawQuiz(roomId))
  const [answers, setAnswers] = useState<number[]>([])
  const question = questions[answers.length]
  if (!question) return null
  const choose = (answer: number) => {
    const next = [...answers, answer]
    if (next.length === questions.length) {
      submit(roomId, next.reduce((total, value, index) => total + (value === questions[index].correctIndex ? 1 : 0), 0))
      setAnswers([])
      return
    }
    setAnswers(next)
  }
  return <><small>QUIZ PHÒNG {roomId} · {answers.length + 1}/5</small><h2>{question.question}</h2><div>{question.options.map((option, index) => <button key={option} onClick={() => choose(index)}>{option}</button>)}</div></>
}
