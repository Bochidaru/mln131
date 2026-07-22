export type QuizQuestion = { question: string; options: string[]; correctIndex: number }
type Item = readonly [question: string, answer: string]

// Static course question bank: 15 questions for each of the eight exhibition rooms.
const bank: Record<number, readonly Item[]> = {
  1: [
    ['Tác phẩm đánh dấu sự ra đời của CNXH khoa học?', 'Tuyên ngôn của Đảng Cộng sản (1848)'],
    ['Ai là hai nhà sáng lập CNXH khoa học?', 'C. Mác và Ph. Ăngghen'],
    ['Một tiền đề tư tưởng của CNXH khoa học là?', 'Triết học cổ điển Đức'],
    ['Phong trào công nhân nào là điều kiện lịch sử quan trọng?', 'Phong trào Hiến chương ở Anh'],
    ['Hạn chế của CNXH không tưởng là?', 'Chưa tìm ra lực lượng và con đường giải phóng hiện thực'],
    ['Phát kiến giải thích sự vận động lịch sử - xã hội là?', 'Chủ nghĩa duy vật lịch sử'],
    ['Phát kiến vạch rõ nguồn gốc bóc lột trong CNTB là?', 'Học thuyết giá trị thặng dư'],
    ['Lực lượng có sứ mệnh lịch sử toàn thế giới là?', 'Giai cấp công nhân'],
    ['Phương pháp luận nền tảng của môn học là?', 'Chủ nghĩa duy vật biện chứng và duy vật lịch sử'],
    ['Phương pháp kết hợp tiến trình và bản chất là?', 'Phương pháp lịch sử - lôgíc'],
    ['Sự kiện thực tiễn Mác - Ăngghen tổng kết sâu sắc là?', 'Công xã Pari năm 1871'],
    ['Lênin phát triển học thuyết trong thời đại nào?', 'Chủ nghĩa đế quốc'],
    ['Cách mạng hiện thực hóa lý luận tại Nga năm 1917 là?', 'Cách mạng Tháng Mười Nga'],
    ['Chính sách Lênin khởi thảo trong thời kỳ quá độ là?', 'Chính sách kinh tế mới (NEP)'],
    ['Yêu cầu chống trong học tập lý luận là?', 'Giáo điều, máy móc'],
  ],
  2: [
    ['Cơ sở khách quan tạo sứ mệnh lịch sử của giai cấp công nhân?', 'Địa vị kinh tế - xã hội của giai cấp công nhân'],
    ['Đại biểu cho lực lượng sản xuất tiên tiến là?', 'Giai cấp công nhân hiện đại'],
    ['Nội dung kinh tế của sứ mệnh là?', 'Xóa bỏ sở hữu tư nhân tư bản chủ nghĩa về tư liệu sản xuất chủ yếu'],
    ['Nội dung chính trị - xã hội của sứ mệnh là?', 'Thiết lập nhà nước kiểu mới của nhân dân lao động'],
    ['Nội dung văn hóa - tư tưởng của sứ mệnh là?', 'Xây dựng hệ giá trị mới và con người mới'],
    ['Điều kiện chủ quan quan trọng nhất là?', 'Sự trưởng thành của bản thân giai cấp công nhân'],
    ['Nhân tố chủ quan quyết định hàng đầu là?', 'Đảng Cộng sản'],
    ['Hình thức tổ chức chính trị cao nhất của giai cấp công nhân là?', 'Đảng Cộng sản'],
    ['Công nhân Việt Nam ra đời gắn với?', 'Chính sách khai thác thuộc địa của thực dân Pháp'],
    ['Đặc điểm nổi bật của công nhân Việt Nam là?', 'Ra đời trước giai cấp tư sản dân tộc'],
    ['Lực lượng lãnh đạo cách mạng Việt Nam là?', 'Giai cấp công nhân thông qua Đảng Cộng sản'],
    ['Liên minh nền tảng trong cách mạng là?', 'Công nhân - nông dân - trí thức'],
    ['Biểu hiện hiện đại của công nhân là?', 'Lao động trong nền công nghiệp và công nghệ hiện đại'],
    ['Mục tiêu cuối cùng của sứ mệnh là?', 'Giải phóng giai cấp, dân tộc và con người'],
    ['Yêu cầu đối với công nhân thời đại số là?', 'Nâng cao trình độ nghề nghiệp và tri thức'],
  ],
  3: [
    ['Đặc trưng chính trị của CNXH là?', 'Nhân dân lao động làm chủ'],
    ['Cơ sở vật chất - kỹ thuật của CNXH là?', 'Nền đại công nghiệp hiện đại'],
    ['Nguyên tắc phân phối chủ yếu ở giai đoạn đầu là?', 'Phân phối theo lao động'],
    ['Thời kỳ quá độ là?', 'Thời kỳ cải biến cách mạng từ xã hội cũ sang xã hội mới'],
    ['Đặc điểm của quá độ lên CNXH ở Việt Nam là?', 'Bỏ qua chế độ tư bản chủ nghĩa'],
    ['Bỏ qua CNTB không có nghĩa là?', 'Phủ định mọi thành tựu văn minh của nhân loại'],
    ['Nhiệm vụ trung tâm thời kỳ quá độ là?', 'Phát triển lực lượng sản xuất và công nghiệp hóa'],
    ['Quan hệ sản xuất phải được xây dựng như thế nào?', 'Phù hợp với trình độ lực lượng sản xuất'],
    ['Kinh tế trong thời kỳ quá độ ở Việt Nam là?', 'Kinh tế nhiều thành phần'],
    ['Thành phần giữ vai trò chủ đạo là?', 'Kinh tế nhà nước'],
    ['Động lực quan trọng phát triển đất nước là?', 'Đại đoàn kết toàn dân tộc'],
    ['Mục tiêu tổng quát của CNXH Việt Nam là?', 'Dân giàu, nước mạnh, dân chủ, công bằng, văn minh'],
    ['Nhà nước trong quá độ mang bản chất?', 'Bản chất giai cấp công nhân'],
    ['Điều kiện bảo đảm định hướng XHCN là?', 'Sự lãnh đạo của Đảng Cộng sản'],
    ['Mâu thuẫn cần giải quyết trong quá độ là?', 'Giữa yêu cầu phát triển cao và xuất phát điểm thấp'],
  ],
  4: [
    ['Dân chủ XHCN là?', 'Quyền làm chủ của nhân dân dưới sự lãnh đạo của Đảng'],
    ['Bản chất chính trị của dân chủ XHCN là?', 'Quyền lực thuộc về nhân dân'],
    ['Nhà nước XHCN mang bản chất?', 'Giai cấp công nhân, tính nhân dân và dân tộc sâu sắc'],
    ['Nguyên tắc tổ chức cơ bản của nhà nước XHCN là?', 'Tập trung dân chủ'],
    ['Nhà nước pháp quyền XHCN Việt Nam do ai lãnh đạo?', 'Đảng Cộng sản Việt Nam'],
    ['Quyền lực nhà nước ở Việt Nam là?', 'Thống nhất, có phân công phối hợp và kiểm soát'],
    ['Chủ thể thực hiện dân chủ là?', 'Nhân dân'],
    ['Dân chủ phải gắn liền với?', 'Kỷ cương và pháp luật'],
    ['Mặt trận Tổ quốc có vai trò?', 'Tập hợp, phát huy sức mạnh đại đoàn kết toàn dân'],
    ['Cơ chế để nhân dân tham gia quản lý là?', 'Dân chủ trực tiếp và dân chủ đại diện'],
    ['Mục tiêu của nhà nước XHCN là?', 'Phục vụ nhân dân lao động'],
    ['Pháp luật trong nhà nước pháp quyền phải?', 'Thượng tôn và bảo vệ quyền con người, quyền công dân'],
    ['Cán bộ, công chức phải là?', 'Công bộc của nhân dân'],
    ['Kiểm soát quyền lực nhằm?', 'Ngăn ngừa tha hóa và lạm quyền'],
    ['Dân chủ XHCN là mục tiêu đồng thời là?', 'Động lực của công cuộc đổi mới'],
  ],
  5: [
    ['Cơ cấu xã hội - giai cấp là?', 'Tổng thể các giai cấp và tầng lớp trong quan hệ xã hội'],
    ['Biến đổi cơ cấu giai cấp chịu tác động trực tiếp của?', 'Cơ cấu kinh tế'],
    ['Liên minh giai cấp nền tảng ở Việt Nam là?', 'Công nhân - nông dân - trí thức'],
    ['Nội dung cốt lõi của liên minh là?', 'Hợp tác kinh tế, chính trị, văn hóa - xã hội'],
    ['Lực lượng giữ vai trò lãnh đạo trong liên minh là?', 'Giai cấp công nhân'],
    ['Nông dân có vai trò quan trọng vì?', 'Là lực lượng đông đảo trong xây dựng nông thôn'],
    ['Trí thức có vai trò nổi bật ở?', 'Khoa học, công nghệ và sáng tạo'],
    ['Mục tiêu của liên minh là?', 'Tạo nền tảng chính trị - xã hội vững chắc cho CNXH'],
    ['Kinh tế thị trường định hướng XHCN làm?', 'Cơ cấu xã hội - giai cấp đa dạng hơn'],
    ['Tầng lớp doanh nhân là?', 'Một bộ phận quan trọng trong phát triển kinh tế'],
    ['Công nhân hiện đại cần gắn với?', 'Trí thức hóa và nâng cao kỹ năng'],
    ['Chính sách xã hội cần hướng tới?', 'Hài hòa lợi ích giữa các giai cấp, tầng lớp'],
    ['Cơ sở chính trị của khối đại đoàn kết là?', 'Liên minh công nhân - nông dân - trí thức'],
    ['Mục tiêu công bằng xã hội đòi hỏi?', 'Phân phối hợp lý thành quả phát triển'],
    ['Liên minh trong thời kỳ quá độ mang tính?', 'Tất yếu khách quan và lâu dài'],
  ],
  6: [
    ['Vấn đề dân tộc xét theo nghĩa rộng là?', 'Quan hệ giữa các quốc gia - dân tộc'],
    ['Vấn đề dân tộc ở Việt Nam là?', 'Quan hệ giữa các tộc người trong quốc gia thống nhất'],
    ['Nguyên tắc giải quyết vấn đề dân tộc là?', 'Bình đẳng, đoàn kết, tôn trọng và giúp nhau phát triển'],
    ['Quyền dân tộc tự quyết gắn với?', 'Lợi ích của giai cấp công nhân và nhân dân lao động'],
    ['Đặc điểm dân tộc Việt Nam là?', 'Cộng đồng thống nhất trong đa dạng'],
    ['Nội dung quan trọng của chính sách dân tộc là?', 'Phát triển toàn diện vùng đồng bào dân tộc thiểu số'],
    ['Tôn giáo là?', 'Một hình thái ý thức xã hội'],
    ['Nguồn gốc xã hội của tôn giáo là?', 'Sự bất lực của con người trước tự nhiên và xã hội'],
    ['Tôn giáo còn tồn tại lâu dài vì?', 'Những nguyên nhân nhận thức, tâm lý và xã hội còn tồn tại'],
    ['Nguyên tắc giải quyết vấn đề tôn giáo là?', 'Tôn trọng tự do tín ngưỡng và không tín ngưỡng'],
    ['Đấu tranh với hoạt động tôn giáo phải?', 'Phân biệt tín ngưỡng chính đáng với lợi dụng tôn giáo'],
    ['Quan hệ dân tộc và tôn giáo cần đặt trên?', 'Lợi ích quốc gia - dân tộc'],
    ['Chính sách nhất quán của Việt Nam là?', 'Đoàn kết đồng bào các dân tộc và tôn giáo'],
    ['Mục tiêu của công tác dân tộc là?', 'Bình đẳng, đoàn kết, tôn trọng, giúp nhau cùng phát triển'],
    ['Đại đoàn kết dân tộc là?', 'Đường lối chiến lược của cách mạng Việt Nam'],
  ],
  7: [
    ['Gia đình là?', 'Tế bào của xã hội'],
    ['Cơ sở xây dựng gia đình thời kỳ quá độ là?', 'Hôn nhân tiến bộ'],
    ['Hôn nhân tiến bộ dựa trên?', 'Tự nguyện, một vợ một chồng, bình đẳng'],
    ['Chức năng đầu tiên của gia đình là?', 'Tái sản xuất ra con người'],
    ['Chức năng kinh tế của gia đình là?', 'Tổ chức sản xuất, tiêu dùng và tái tạo sức lao động'],
    ['Chức năng giáo dục của gia đình là?', 'Nuôi dưỡng và hình thành nhân cách'],
    ['Chức năng thỏa mãn nhu cầu tâm sinh lý là?', 'Duy trì tình cảm và hạnh phúc gia đình'],
    ['Biến đổi quy mô gia đình hiện đại là?', 'Xu hướng gia đình hạt nhân tăng lên'],
    ['Quan hệ vợ chồng trong gia đình mới hướng tới?', 'Bình đẳng giới'],
    ['Xây dựng gia đình cần kế thừa?', 'Giá trị truyền thống tốt đẹp'],
    ['Gia đình văn hóa cần bảo đảm?', 'No ấm, tiến bộ, hạnh phúc, văn minh'],
    ['Vai trò nhà nước trong gia đình là?', 'Hoàn thiện luật pháp và chính sách hỗ trợ'],
    ['Một thách thức của gia đình hiện đại là?', 'Bạo lực gia đình'],
    ['Giáo dục gia đình cần kết hợp với?', 'Nhà trường và xã hội'],
    ['Mục tiêu xây dựng gia đình XHCN là?', 'Phát triển con người toàn diện'],
  ],
  8: [
    ['Con đường đi lên CNXH ở Việt Nam gắn với?', 'Độc lập dân tộc'],
    ['Mục tiêu phát triển đến năm 2045 là?', 'Trở thành nước phát triển, thu nhập cao'],
    ['Mục tiêu đến năm 2030 là?', 'Nước đang phát triển có công nghiệp hiện đại'],
    ['Nền tảng tư tưởng của Đảng là?', 'Chủ nghĩa Mác - Lênin và tư tưởng Hồ Chí Minh'],
    ['Yêu cầu trong vận dụng lý luận là?', 'Sáng tạo, gắn với thực tiễn Việt Nam'],
    ['Động lực quan trọng của đổi mới là?', 'Đại đoàn kết toàn dân tộc'],
    ['Mục tiêu xã hội Việt Nam hướng tới là?', 'Dân giàu, nước mạnh, dân chủ, công bằng, văn minh'],
    ['Đổi mới cần kiên định?', 'Mục tiêu độc lập dân tộc và CNXH'],
    ['Phát triển đất nước phải dựa vào?', 'Nhân dân'],
    ['Vai trò của sinh viên là?', 'Học tập, rèn luyện và có trách nhiệm công dân'],
    ['Xây dựng CNXH là sự nghiệp của?', 'Toàn dân dưới sự lãnh đạo của Đảng'],
    ['Yêu cầu đối với phát triển là?', 'Kết hợp tăng trưởng kinh tế với tiến bộ, công bằng xã hội'],
    ['Tổng kết thực tiễn nhằm?', 'Bổ sung và phát triển lý luận'],
    ['Đổi mới không phải là?', 'Từ bỏ mục tiêu xã hội chủ nghĩa'],
    ['Tinh thần của phòng kết là?', 'Biến tri thức lý luận thành hành động có trách nhiệm'],
  ],
}

const answers = Object.values(bank).flatMap((items) => items.map((item) => item[1]))

export function getRoomQuestionBank(roomId: number): QuizQuestion[] {
  const items = bank[roomId] ?? []
  return items.map(([question, correct], index) => {
    const options = [answers[(index * 11 + roomId * 17) % answers.length], answers[(index * 19 + roomId * 7) % answers.length], answers[(index * 23 + roomId * 3) % answers.length]]
    const unique = [...new Set(options.filter((answer) => answer !== correct))]
    let cursor = index * 29 + roomId
    while (unique.length < 3) {
      const candidate = answers[cursor % answers.length]
      if (candidate !== correct && !unique.includes(candidate)) unique.push(candidate)
      cursor += 31
    }
    const correctIndex = (index + roomId) % 4
    unique.splice(correctIndex, 0, correct)
    return { question, options: unique.slice(0, 4), correctIndex }
  })
}

export function drawQuiz(roomId: number) {
  return [...getRoomQuestionBank(roomId)].sort(() => Math.random() - 0.5).slice(0, 5)
}
