export interface PosterData { id: string; image: string; title: string; summary: string; keyPoints: string[] }
export interface RoomData { id: number; name: string; subtitle: string; posters: PosterData[] }

const poster = (id: string, title: string, summary: string, keyPoints: string[]): PosterData => ({
  id, title, summary, keyPoints, image: `${import.meta.env.BASE_URL}posters/${id}.webp`,
})

export const rooms: RoomData[] = [
  { id: 0, name: 'Hành trình bắt đầu', subtitle: 'Sảnh đón', posters: [
    poster('sanh-ban-do', 'Bản đồ hành trình', 'Chín không gian nối tiếp dẫn người xem từ sự ra đời của chủ nghĩa xã hội khoa học đến những vấn đề của Việt Nam trong thời kỳ quá độ.', ['Đi theo trục hành lang từ sảnh đến phòng kết', 'WASD hoặc joystick để di chuyển', 'Đưa tâm ngắm vào poster và chọn để đọc']),
    poster('sanh-mon-hoc', 'Một khoa học về giải phóng', 'Chủ nghĩa xã hội khoa học nghiên cứu những quy luật và điều kiện chính trị - xã hội của quá trình chuyển biến từ chủ nghĩa tư bản lên chủ nghĩa xã hội và chủ nghĩa cộng sản.', ['Một trong ba bộ phận cấu thành chủ nghĩa Mác - Lênin', 'Gắn lý luận với phong trào công nhân', 'Hướng đến giải phóng giai cấp, xã hội và con người']),
  ]},
  { id: 1, name: 'Từ không tưởng đến khoa học', subtitle: 'Chương 1', posters: [
    poster('c1-khong-tuong', 'Những người mở đường', 'Saint-Simon, Fourier và Owen phê phán xã hội tư bản đầu thế kỷ XIX và hình dung một xã hội công bằng hơn. Tư tưởng của họ giàu giá trị nhân đạo nhưng chưa chỉ ra được lực lượng và con đường hiện thực để cải tạo xã hội.', ['Phê phán áp bức và bất bình đẳng', 'Đề cao lao động, hợp tác và cộng đồng', 'Mang tính không tưởng do hạn chế lịch sử']),
    poster('c1-buoc-ngoat', 'Bước ngoặt khoa học', 'Marx và Engels kế thừa có phê phán các thành tựu tư tưởng, đồng thời dựa trên chủ nghĩa duy vật lịch sử và học thuyết giá trị thặng dư để luận chứng sứ mệnh lịch sử của giai cấp công nhân.', ['Chủ nghĩa duy vật lịch sử', 'Học thuyết giá trị thặng dư', 'Sứ mệnh lịch sử của giai cấp công nhân']),
    poster('c1-phat-trien', 'Một học thuyết sống', 'Từ Tuyên ngôn của Đảng Cộng sản, chủ nghĩa xã hội khoa học tiếp tục được phát triển qua thực tiễn phong trào cách mạng và sự vận dụng sáng tạo trong những điều kiện lịch sử khác nhau.', ['Gắn với thực tiễn cách mạng', 'Được Lênin bảo vệ và phát triển', 'Cần vận dụng phù hợp điều kiện cụ thể']),
  ]},
  { id: 2, name: 'Sứ mệnh lịch sử', subtitle: 'Chương 2', posters: [
    poster('c2-giai-cap', 'Giai cấp của nền đại công nghiệp', 'Giai cấp công nhân hình thành và phát triển cùng nền đại công nghiệp, trực tiếp hoặc gián tiếp vận hành những công cụ sản xuất hiện đại và về cơ bản không sở hữu tư liệu sản xuất chủ yếu.', ['Đại diện lực lượng sản xuất tiên tiến', 'Có tính tổ chức và kỷ luật lao động', 'Lợi ích căn bản thống nhất với đông đảo người lao động']),
    poster('c2-su-menh', 'Nội dung sứ mệnh lịch sử', 'Thông qua chính đảng tiên phong, giai cấp công nhân đấu tranh xóa bỏ chế độ áp bức, xây dựng xã hội mới trên các phương diện kinh tế, chính trị và văn hóa - tư tưởng.', ['Giải phóng giai cấp và người lao động', 'Xây dựng quan hệ sản xuất tiến bộ', 'Phát triển văn hóa và con người mới']),
    poster('c2-viet-nam', 'Công nhân Việt Nam hôm nay', 'Giai cấp công nhân Việt Nam ra đời trước giai cấp tư sản dân tộc, gắn bó với dân tộc và dưới sự lãnh đạo của Đảng. Trong đổi mới, lực lượng này cần lớn mạnh cả về số lượng, chất lượng và bản lĩnh.', ['Tiên phong trong công nghiệp hóa, hiện đại hóa', 'Nâng cao tri thức, kỹ năng và tác phong công nghiệp', 'Chăm lo quyền lợi và đời sống người lao động']),
  ]},
  { id: 3, name: 'CNXH và thời kỳ quá độ', subtitle: 'Chương 3', posters: [
    poster('c3-hinh-thai', 'Giai đoạn đầu của xã hội mới', 'Chủ nghĩa xã hội được xem là giai đoạn đầu của hình thái kinh tế - xã hội cộng sản chủ nghĩa, ra đời trên cơ sở cải biến sâu sắc xã hội cũ và từng bước tạo lập cơ sở vật chất, tinh thần mới.', ['Giải phóng lực lượng sản xuất', 'Nhân dân lao động làm chủ', 'Hướng đến phát triển con người toàn diện']),
    poster('c3-qua-do', 'Thời kỳ chuyển biến', 'Thời kỳ quá độ là giai đoạn cải biến lâu dài, phức tạp trên mọi lĩnh vực. Cái mới và tàn dư của xã hội cũ cùng tồn tại, đan xen và đấu tranh với nhau.', ['Tồn tại nhiều hình thức sở hữu và thành phần kinh tế', 'Cơ cấu xã hội còn đa dạng', 'Cần xây dựng đồng bộ kinh tế, chính trị và văn hóa']),
    poster('c3-viet-nam', 'Con đường Việt Nam lựa chọn', 'Việt Nam quá độ lên chủ nghĩa xã hội bỏ qua chế độ tư bản chủ nghĩa, tức bỏ qua việc xác lập địa vị thống trị của quan hệ sản xuất và kiến trúc thượng tầng tư bản chủ nghĩa, đồng thời tiếp thu thành tựu mà nhân loại đã đạt được.', ['Phát triển kinh tế thị trường định hướng XHCN', 'Công nghiệp hóa, hiện đại hóa đất nước', 'Độc lập dân tộc gắn liền với chủ nghĩa xã hội']),
  ]},
  { id: 4, name: 'Dân chủ XHCN và Nhà nước XHCN', subtitle: 'Chương 4', posters: [
    poster('c4-dan-chu', 'Quyền lực thuộc về nhân dân', 'Dân chủ xã hội chủ nghĩa là nền dân chủ mà quyền lực thuộc về nhân dân, được thực hiện ngày càng đầy đủ trong đời sống kinh tế, chính trị, văn hóa và xã hội.', ['Dân chủ vừa là mục tiêu vừa là động lực', 'Gắn quyền với nghĩa vụ công dân', 'Thực hiện bằng dân chủ trực tiếp và đại diện']),
    poster('c4-nha-nuoc', 'Nhà nước xã hội chủ nghĩa', 'Nhà nước xã hội chủ nghĩa là công cụ chủ yếu để nhân dân thực hiện quyền lực, tổ chức xây dựng xã hội mới và bảo vệ lợi ích của đại đa số nhân dân lao động.', ['Mang bản chất giai cấp công nhân', 'Có tính nhân dân rộng rãi', 'Thực hiện chức năng tổ chức và quản lý xã hội']),
    poster('c4-phap-quyen', 'Nhà nước pháp quyền Việt Nam', 'Xây dựng Nhà nước pháp quyền xã hội chủ nghĩa Việt Nam của Nhân dân, do Nhân dân, vì Nhân dân đòi hỏi thượng tôn Hiến pháp và pháp luật, kiểm soát quyền lực và bảo đảm quyền con người.', ['Đảng lãnh đạo, Nhà nước quản lý, Nhân dân làm chủ', 'Quyền lực nhà nước thống nhất, có phân công và kiểm soát', 'Cải cách hành chính và tư pháp']),
  ]},
  { id: 5, name: 'Cơ cấu xã hội — giai cấp và liên minh', subtitle: 'Chương 5', posters: [
    poster('c5-co-cau', 'Một cơ cấu đang chuyển động', 'Trong thời kỳ quá độ, cơ cấu xã hội - giai cấp biến đổi gắn với cơ cấu kinh tế. Các giai cấp, tầng lớp vừa hợp tác vừa có khác biệt lợi ích cần được điều hòa.', ['Giai cấp công nhân giữ vai trò lãnh đạo', 'Nông dân có vị trí chiến lược', 'Đội ngũ trí thức ngày càng quan trọng']),
    poster('c5-lien-minh', 'Nền tảng của khối đại đoàn kết', 'Liên minh giữa giai cấp công nhân, giai cấp nông dân và đội ngũ trí thức là nền tảng chính trị - xã hội của Nhà nước và của khối đại đoàn kết toàn dân tộc.', ['Do giai cấp công nhân thông qua Đảng lãnh đạo', 'Hợp tác trên các mặt kinh tế, chính trị, văn hóa - xã hội', 'Bảo đảm hài hòa lợi ích các chủ thể']),
    poster('c5-thuc-tien', 'Liên kết trong phát triển', 'Ở Việt Nam, liên minh được củng cố bằng phát triển sản xuất, xây dựng nông thôn mới, nâng cao tri thức và tạo cơ hội để mọi lực lượng đóng góp vào mục tiêu chung.', ['Gắn công nghiệp với nông nghiệp và khoa học', 'Phát triển nguồn nhân lực', 'Thực hiện tiến bộ và công bằng xã hội']),
  ]},
  { id: 6, name: 'Dân tộc và tôn giáo', subtitle: 'Chương 6', posters: [
    poster('c6-cuong-linh', 'Bình đẳng, tự quyết, đoàn kết', 'Cương lĩnh dân tộc của chủ nghĩa Mác - Lênin nêu ba nội dung cơ bản: các dân tộc hoàn toàn bình đẳng, có quyền tự quyết, và công nhân tất cả các dân tộc liên hiệp lại.', ['Chống áp bức và kỳ thị dân tộc', 'Tôn trọng quyền lựa chọn con đường phát triển', 'Đoàn kết trên cơ sở bình đẳng']),
    poster('c6-viet-nam', 'Thống nhất trong đa dạng', 'Việt Nam là quốc gia thống nhất gồm 54 dân tộc. Chính sách dân tộc hướng tới bình đẳng, đoàn kết, tôn trọng, giúp nhau cùng phát triển và thu hẹp khoảng cách giữa các vùng.', ['Đại đoàn kết toàn dân tộc', 'Ưu tiên phát triển vùng dân tộc thiểu số', 'Bảo tồn và phát huy bản sắc văn hóa']),
    poster('c6-ton-giao', 'Tôn trọng tự do tín ngưỡng', 'Tôn giáo còn tồn tại trong thời kỳ quá độ do nhiều nguyên nhân. Việt Nam tôn trọng quyền tự do tín ngưỡng, tôn giáo và quyền không tín ngưỡng, đồng thời bảo đảm hoạt động trong khuôn khổ pháp luật.', ['Đoàn kết đồng bào có và không có tôn giáo', 'Phân biệt nhu cầu tín ngưỡng với hành vi lợi dụng tôn giáo', 'Phát huy giá trị văn hóa, đạo đức tốt đẹp']),
  ]},
  { id: 7, name: 'Gia đình trong thời kỳ quá độ', subtitle: 'Chương 7', posters: [
    poster('c7-vi-tri', 'Tế bào của xã hội', 'Gia đình là một cộng đồng xã hội đặc biệt, được hình thành chủ yếu trên cơ sở hôn nhân, huyết thống và nuôi dưỡng. Gia đình là tế bào của xã hội và là tổ ấm của mỗi người.', ['Cầu nối giữa cá nhân và xã hội', 'Môi trường đầu tiên hình thành nhân cách', 'Sự bền vững gia đình góp phần ổn định xã hội']),
    poster('c7-chuc-nang', 'Bốn chức năng cơ bản', 'Gia đình thực hiện các chức năng tái sản xuất con người; nuôi dưỡng, giáo dục; kinh tế và tổ chức tiêu dùng; thỏa mãn nhu cầu tâm sinh lý, duy trì tình cảm.', ['Duy trì và phát triển dân số', 'Chăm sóc và xã hội hóa thế hệ mới', 'Tạo dựng đời sống vật chất và tinh thần']),
    poster('c7-xay-dung', 'Gia đình Việt Nam tiến bộ', 'Xây dựng gia đình no ấm, tiến bộ, hạnh phúc, văn minh cần kế thừa giá trị truyền thống tốt đẹp, tiếp thu giá trị tiến bộ và thúc đẩy bình đẳng giới.', ['Hôn nhân tự nguyện, tiến bộ, một vợ một chồng', 'Bình đẳng và chia sẻ trách nhiệm', 'Phòng chống bạo lực gia đình']),
  ]},
  { id: 8, name: 'Con đường phía trước', subtitle: 'Phòng kết', posters: [
    poster('ket-con-duong', 'Tương lai được dựng xây hôm nay', 'Con đường đi lên chủ nghĩa xã hội ở Việt Nam là sự nghiệp lâu dài của nhân dân, đòi hỏi kiên định mục tiêu, đồng thời không ngừng đổi mới sáng tạo từ thực tiễn.', ['Học tập và lao động có trách nhiệm', 'Tôn trọng pháp luật, quyền và lợi ích chính đáng của cộng đồng', 'Góp phần xây dựng đất nước phồn vinh, hạnh phúc']),
  ]},
]

export const uiText = {
  eyebrow: 'Triển lãm tương tác · 2026', title: 'Bảo tàng\nTri thức MLN131', enter: 'Bắt đầu tham quan',
  intro: 'Bảy chương · Tám phòng chuyên đề · Một hành trình từ lý luận đến thực tiễn', instructions: 'WASD để di chuyển · Chuột để quan sát · ESC để thả chuột',
  view: 'Nhấn E hoặc chọn để xem', close: 'Đóng', audioOn: 'Tắt âm thanh', audioOff: 'Bật âm thanh', map: 'Sơ đồ tầng', fallbackTitle: 'Tham quan bản 2D',
}
