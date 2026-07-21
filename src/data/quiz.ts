import { rooms } from './content'

export type QuizQuestion = { question: string; options: string[]; correctIndex: number }

const stems = ['Luận điểm nào thuộc nội dung phòng này?', 'Nội dung nào được giáo trình nhấn mạnh?', 'Nhận định nào phù hợp với chủ đề phòng?', 'Ý nào phản ánh đúng kiến thức tại đây?']

// Each room exposes 30 shuffled four-choice questions built from its course facts.
export function getRoomQuestionBank(roomId: number): QuizQuestion[] {
  const room = rooms.find((item) => item.id === roomId)
  if (!room) return []
  const ownFacts = room.posters.flatMap((poster) => poster.keyPoints)
  const otherFacts = rooms.filter((item) => item.id !== roomId).flatMap((item) => item.posters.flatMap((poster) => poster.keyPoints))
  return Array.from({ length: 30 }, (_, index) => {
    const correct = ownFacts[index % ownFacts.length]
    const distractors = [1, 7, 13].map((offset) => otherFacts[(index * 5 + offset) % otherFacts.length])
    const options = [correct, ...distractors].sort((a, b) => (a + index).localeCompare(b + index))
    return { question: stems[index % stems.length], options, correctIndex: options.indexOf(correct) }
  })
}

export function drawQuiz(roomId: number) {
  return [...getRoomQuestionBank(roomId)].sort(() => Math.random() - 0.5).slice(0, 5)
}
