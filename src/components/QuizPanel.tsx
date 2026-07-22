import { useEffect, useRef, useState } from 'react'
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
  const [questionIndex, setQuestionIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const advanceTimer = useRef<number | null>(null)
  const question = questions[questionIndex]

  useEffect(() => () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
  }, [])

  if (!question) return null
  const choose = (answer: number) => {
    if (selectedAnswer !== null) return
    const isCorrect = answer === question.correctIndex
    const nextCorrectCount = correctCount + (isCorrect ? 1 : 0)
    setSelectedAnswer(answer)
    advanceTimer.current = window.setTimeout(() => {
      if (questionIndex + 1 === questions.length) submit(roomId, nextCorrectCount)
      else {
        setQuestionIndex((index) => index + 1)
        setCorrectCount(nextCorrectCount)
        setSelectedAnswer(null)
      }
    }, 1000)
  }
  return <><small>QUIZ PHÒNG {roomId} · {questionIndex + 1}/5</small><h2>{question.question}</h2><div>{question.options.map((option, index) => {
    const isRevealed = selectedAnswer !== null
    const className = isRevealed ? index === question.correctIndex ? 'is-correct' : index === selectedAnswer ? 'is-wrong' : '' : ''
    return <button key={option} className={className} disabled={isRevealed} onClick={() => choose(index)}>{option}</button>
  })}</div>{selectedAnswer !== null && <p className="quiz-feedback">{selectedAnswer === question.correctIndex ? 'Chính xác. ' : 'Chưa đúng. '}Đáp án đúng: {question.options[question.correctIndex]}</p>}</>
}
