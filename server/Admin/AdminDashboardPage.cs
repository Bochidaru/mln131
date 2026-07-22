namespace server.Admin;

public static class AdminDashboardPage
{
    public const string Html = """
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MLN131 | Admin</title>
  <style>
    :root{--ink:#18211d;--paper:#f4eddf;--gold:#bb8745;--red:#a44035;--muted:#77827a}*{box-sizing:border-box}body{margin:0;color:var(--paper);background:radial-gradient(circle at 10% 0,#31453a 0,#17211d 37%,#101512 100%);font:14px/1.45 Georgia,serif;min-height:100vh}main{max-width:1200px;margin:auto;padding:36px 22px 70px}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:30px;border-bottom:1px solid #647066;padding-bottom:18px}h1{margin:0;font-size:clamp(30px,6vw,54px);font-weight:500;letter-spacing:-.04em}header p{margin:0;color:#d8cbb3;font:11px/1.3 monospace;text-align:right;text-transform:uppercase;letter-spacing:.12em}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.metric,.panel{border:1px solid rgba(244,237,223,.2);background:rgba(15,22,18,.6);box-shadow:0 18px 45px rgba(0,0,0,.16)}.metric{padding:17px}.metric span,.eyebrow{color:#c6aa7d;font:10px/1.2 monospace;letter-spacing:.12em;text-transform:uppercase}.metric strong{display:block;margin-top:8px;font-size:28px;font-weight:400}.panel{margin-top:18px;padding:20px}h2{margin:0 0 15px;font-size:22px;font-weight:400}table{width:100%;border-collapse:collapse}th,td{padding:11px 8px;border-bottom:1px solid rgba(244,237,223,.12);text-align:left}th{color:#c6aa7d;font:10px monospace;text-transform:uppercase;letter-spacing:.08em}td{font-size:14px}td.muted{color:#a7b1a8;font-family:monospace;font-size:11px}button{border:1px solid #d96d5f;color:#fff0e9;background:#81342c;padding:7px 11px;cursor:pointer;font:10px monospace;letter-spacing:.08em;text-transform:uppercase}button:hover{background:#a44035}.empty{color:#a7b1a8;font-style:italic}#notice{min-height:20px;margin:14px 0 0;color:#e1c086;font:11px monospace}@media(max-width:720px){main{padding:23px 14px}header{align-items:flex-start;flex-direction:column}header p{text-align:left}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.panel{overflow-x:auto}table{min-width:650px}}
  </style>
</head>
<body><main>
  <header><div><div class="eyebrow">Virtual Museum / Operations</div><h1>Phòng điều hành</h1></div><p id="updated">Đang tải...</p></header>
  <section class="grid">
    <article class="metric"><span>Người chơi online</span><strong id="online">-</strong></article>
    <article class="metric"><span>Duel đang diễn ra</span><strong id="duels">-</strong></article>
    <article class="metric"><span>CPU máy chủ</span><strong id="cpu">-</strong></article>
    <article class="metric"><span>RAM khả dụng</span><strong id="ram">-</strong></article>
  </section>
  <section class="panel"><h2>Người chơi & bảng điểm</h2><table><thead><tr><th>Tên</th><th>Điểm</th><th>Khu vực</th><th>Trạng thái</th><th>ID</th><th></th></tr></thead><tbody id="players"></tbody></table><p id="notice"></p></section>
  <section class="panel"><h2>Các cặp duel</h2><table><thead><tr><th>Người chơi A</th><th>Người chơi B</th><th>Tỷ số</th><th>Trạng thái</th></tr></thead><tbody id="duel-list"></tbody></table></section>
</main><script>
const text=(v)=>document.createTextNode(v);const bytes=(n)=>n==null?'Không rõ':n>1024**3?(n/1024**3).toFixed(1)+' GB':(n/1024**2).toFixed(0)+' MB';
function row(values){const tr=document.createElement('tr');values.forEach(v=>{const td=document.createElement('td');if(v instanceof Node)td.append(v);else td.append(text(v));tr.append(td)});return tr}
async function kick(id,name){if(!confirm('Kick '+name+' khỏi bảo tàng?'))return;const r=await fetch('/admin/api/players/'+encodeURIComponent(id)+'/kick',{method:'POST'});document.querySelector('#notice').textContent=r.ok?'Đã kick '+name+'.':'Không thể kick người chơi này.';await load()}
function empty(target,columns,message){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=columns;td.className='empty';td.textContent=message;tr.append(td);target.replaceChildren(tr)}
async function load(){try{const r=await fetch('/admin/api/status',{cache:'no-store'});if(!r.ok)throw new Error();const s=await r.json();online.textContent=s.onlineCount;duels.textContent=s.duels.length;cpu.textContent=s.metrics.cpuPercent==null?'Đang đo':s.metrics.cpuPercent+'%';ram.textContent=bytes(s.metrics.availableMemoryBytes);updated.textContent='CẬP NHẬT '+new Date().toLocaleTimeString('vi-VN');const p=document.querySelector('#players');p.replaceChildren();if(!s.players.length)empty(p,6,'Chưa có người chơi online.');else s.players.forEach(x=>{const b=document.createElement('button');b.textContent='Kick';b.onclick=()=>kick(x.id,x.name);p.append(row([x.name,x.score,x.area,x.inDuel?'Đang duel':'Đang tham quan',x.id.slice(0,8),b]))});const d=document.querySelector('#duel-list');d.replaceChildren();if(!s.duels.length)empty(d,4,'Không có trận duel nào.');else s.duels.forEach(x=>d.append(row([x.first.name,x.second.name,x.first.wins+' : '+x.second.wins,x.finishing?'Đang trả về':'Đang đấu'])))}catch{document.querySelector('#notice').textContent='Không tải được dữ liệu dashboard.'}}
load();setInterval(load,2000);
</script></body></html>
""";
}
