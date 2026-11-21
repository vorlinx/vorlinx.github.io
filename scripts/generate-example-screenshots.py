#!/usr/bin/env python3
"""Render localized, replaceable concept PNGs; preserve files unless --overwrite.
Requires rsvg-convert only for regeneration. All document content is illustrative.
"""
import argparse
import html
from pathlib import Path
import shutil
import subprocess
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ('zh-hans-cn', 'zh-hant-tw', 'en-us')
FILES = [
    ('工作效率观察.pdf','工作效率觀察.pdf','Work efficiency.pdf'),
    ('调研结果.xlsx','調研結果.xlsx','Research results.xlsx'),
    ('阅读笔记.md','閱讀筆記.md','Reading notes.md'),
    ('我的观点.md','我的觀點.md','My perspective.md'),
    ('分享提纲.md','分享提綱.md','Talk outline.md'),
    ('分享演示.pptx','分享簡報.pptx','Presentation.pptx'),
    ('注意力分散的原因.png','注意力分散的原因.png','Why we get distracted.png'),
    ('案例与参考','案例與參考','Cases and references'),
    ('本周安排.md','本週安排.md','This week.md'),
    ('2026秋季课程表.pdf','2026秋季課表.pdf','Autumn 2026 timetable.pdf'),
    ('实验观察记录.xlsx','實驗觀察紀錄.xlsx','Experiment log.xlsx'),
    ('酸碱与指示剂.pdf','酸鹼與指示劑.pdf','Acids and indicators.pdf'),
    ('老人与海.pdf','老人與海.pdf','The Old Man and the Sea.pdf'),
    ('背影.pdf','背影.pdf','A Father’s Back.pdf'),
    ('访谈摘录.md','訪談摘錄.md','Interview excerpts.md'),
    ('专注工作的方法.pdf','專注工作的方法.pdf','Working with focus.pdf'),
    ('工作环境参考.png','工作環境參考.png','Workspace reference.png'),
    ('白板讨论.jpg','白板討論.jpg','Whiteboard discussion.jpg')]
BLUE = '#1a73e8'
LOCALE = 0

def L(cn, tw, en): return (cn, tw, en)[LOCALE]
def file(n): return FILES[n][LOCALE]
def rect(x,y,w,h,fill='#fff',r=0,stroke='none'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"/>'
def text(x,y,value,size=24,color='#3d4650',anchor='start',width=None,weight=400):
    if width:
        units=sum(1 if unicodedata.east_asian_width(c) in 'WF' else .55 for c in value)
        size=min(size,width/max(1,units))
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}" font-weight="{weight}">{html.escape(value)}</text>'
def line(x,y,a,b,color='#b1c8e9',width=2):
    return f'<path d="M{x} {y}L{a} {b}" stroke="{color}" stroke-width="{width}" fill="none"/>'
def circle(x,y,r,fill,stroke='none'):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}"/>'
def base(title,hero=False):
    w,h=(1600,1000) if hero else (1200,800)
    p=[rect(0,0,w,h,'#f5f5f5',18),rect(58,48,w-70,h-62,'#fff',12)]
    for x,c in ((24,'#ff6157'),(45,'#febc2e'),(66,'#28c840')):p.append(circle(x,23,5,c))
    p += [text(w/2,29,'Vorlinx',15,'#747c84','middle'),text(84,91,title,25,width=w-180),line(58,114,w-12,114,'#edf0f3',1)]
    for i in range(5):
        p += [rect(12,145+i*60,34,34,'#e9eef5' if i==0 else '#f5f5f5',9),rect(22,155+i*60,14,13,'none',3,'#8796a5')]
    return p

def icon(x,y,kind,size=64):
    colors={'PDF':('#f7eee9','#ae7357'),'MD':('#edf4ff',BLUE),'XLS':('#edf6ef','#6c9977'),'PPT':('#faf0e9','#bf8961'),'IMG':('#edf4f2','#789c91'),'GROUP':('#edf2fa','#7292be')}
    fill,ink=colors[kind]
    p=[rect(x-size/2,y-size/2,size,size,fill,14)]
    if kind=='IMG':
        p += [circle(x+size*.18,y-size*.18,size*.08,'#e1c68b'),f'<path d="M{x-size*.35} {y+size*.28}L{x-size*.12} {y-size*.06}L{x+size*.05} {y+size*.1}L{x+size*.3} {y-size*.13}V{y+size*.3}Z" fill="{ink}"/>']
    elif kind=='GROUP':
        for dy in (-12,0,12):p += [rect(x-20,y+dy-3,40,6,'#c5d5ec',3)]
    else:
        p += [text(x,y+2,kind,17,ink,'middle',weight=500),rect(x-14,y+10,28,2,ink,1),rect(x-14,y+17,20,2,ink,1)]
    return p

def node(x,y,n,kind,size=62,labelwidth=210):
    return icon(x,y,kind,size)+[rect(x-labelwidth/2,y+size/2+7,labelwidth,29,'#fff',4),text(x,y+size/2+27,file(n),20,'#4f5965','middle',width=labelwidth)]

def link_canvas():
    p=base(L('我的资料','我的資料','My library'),True)
    p += [text(110,164,L('正在做的事','正在做的事','In progress'),23,'#53606d'),text(1180,164,L('每天都要用','每天都要用','Everyday essentials'),23,'#53606d')]
    positions={0:(230,260),1:(250,500),2:(485,330),3:(665,490),4:(865,340),5:(940,600),6:(490,700),7:(890,790)}
    for a,b in ((0,2),(2,3),(1,3),(6,3),(3,4),(4,5),(7,4)):
        p.append(line(*positions[a],*positions[b],width=2))
    for n,kind in ((0,'PDF'),(1,'XLS'),(2,'MD'),(3,'MD'),(4,'MD'),(5,'PPT'),(6,'IMG')):
        p += node(*positions[n],n,kind,72 if n==3 else 62)
    x,y=positions[7]
    p += [rect(x-140,y-39,280,86,'#f7f9fc',16,'#dbe5f2')]+icon(x-96,y,'GROUP',52)
    p += [text(x-55,y-3,file(7),22,width=178),text(x-55,y+23,L('3 份资料','3 份資料','3 files'),16,'#89939e')]
    p += [line(1100,190,1100,895,'#edf0f3',1)]
    for n,y,kind in ((8,245,'MD'),(9,375,'PDF'),(10,505,'XLS'),(11,635,'PDF')):
        p += icon(1175,y,kind,54)+[text(1220,y+7,file(n),22,width=335)]
    p += [text(1180,760,L('最近在读','最近在讀','Currently reading'),23,'#53606d')]
    p += node(1230,830,12,'PDF',52,210)+node(1460,830,13,'PDF',52,210)
    p += [text(110,960,L('阅读、整理，继续自己的思路。','閱讀、整理，繼續自己的思路。','Read, organize, and pick up your train of thought.'),19,'#8a939d')]
    return p

def groups():
    p=base(file(7))
    p += [rect(90,150,400,590,'#f8fafc',18),text(120,200,L('画布上的分组','畫布上的分組','A group on your canvas'),23,'#7b8794',width=340)]
    p += node(285,335,4,'MD',76,330)+[line(285,380,285,505)]
    p += [rect(120,505,340,104,'#eef4ff',15,'#c7dafa')]+icon(166,557,'GROUP',58)
    p += [text(210,548,file(7),25,width=225),text(210,582,L('3 份资料 · 已展开','3 份資料 · 已展開','3 files · Open'),18,'#7d8b9b',width=230)]
    p += [rect(525,150,630,590,'#fff',18,'#e5eaf0'),text(560,205,file(7),30,width=540),text(560,246,L('来自不同文件夹，围绕同一个主题。','來自不同資料夾，圍繞同一個主題。','Different folders. One shared topic.'),20,'#83909d',width=545)]
    for n,y,kind in ((14,340,'MD'),(15,470,'PDF'),(16,600,'IMG')):
        p += icon(600,y,kind,64)+[text(650,y+7,file(n),28,width=465),line(560,y+60,1115,y+60,'#eff2f5',1)]
    return p

def pdf():
    p=base(file(0))
    p += [rect(58,114,1130,670,'#eef0f3'),rect(125,148,750,603,'#fff',3),text(170,210,L('工作效率观察','工作效率觀察','Work efficiency'),35,weight=500,width=650)]
    lines=[L('把注意力留给真正重要的事。','把注意力留給真正重要的事。','Make room for work that matters.'),L('频繁切换窗口，会打断正在形成的思路。','頻繁切換視窗，會打斷正在形成的思路。','Switching windows interrupts a train of thought.'),L('相关的资料，应当放在容易找到的位置。','相關的資料，應當放在容易找到的位置。','Keep related material within easy reach.'),L('先理解资料之间的关系，再整理自己的观点。','先理解資料之間的關係，再整理自己的觀點。','Understand the relationships. Form your own view.')]
    for i,t in enumerate(lines):
        y=295+i*90
        if i==1:p.append(rect(163,y-30,668,47,'#fff2b4',4))
        p.append(text(175,y,t,26,width=640))
        if i==2:p.append(line(175,y+10,792,y+10,BLUE,2))
    p += [text(175,680,L('阅读记录 · 第 3 页','閱讀紀錄 · 第 3 頁','Reading progress · Page 3'),19,'#8b95a1')]
    p += [rect(897,300,260,215,'#fff9e8',13,'#efe3ba'),text(920,342,L('我的便签','我的便箋','My note'),25,width=210),text(920,394,L('把这个观点','把這個觀點','Add this idea'),23,width=210),text(920,434,L('放进分享提纲。','放進分享提綱。','to the outline.'),23,width=210)]
    p += [rect(897,560,260,120,'#fff',13),text(920,605,L('高亮 · 下划线','醒目標示 · 底線','Highlight · Underline'),21,BLUE,width=215),text(920,646,L('删除线 · 便签','刪除線 · 便箋','Strikethrough · Notes'),21,'#6d7b8b',width=215)]
    return p

def files():
    p=base(file(8))
    p += [rect(58,114,270,670,'#f7f8fa'),text(87,170,L('每天都要用','每天都要用','Everyday essentials'),23,width=215)]
    for i,n in enumerate((8,9,10,11)):
        y=235+i*90
        if i==0:p.append(rect(76,y-35,235,63,'#eaf2ff',10))
        p.append(text(92,y,file(n),23,BLUE if i==0 else '#748090',width=205))
    p += [text(380,171,'Markdown',19,'#8e98a4'),text(380,245,L('本周安排','本週安排','This week'),39,weight=500),text(380,305,L('阅读与分享','閱讀與分享','Reading and sharing'),25)]
    tasks=[L('阅读《工作效率观察》','閱讀《工作效率觀察》','Read Work efficiency'),L('整理调研结果','整理調研結果','Review the research results'),L('补充阅读笔记','補充閱讀筆記','Add to my reading notes'),L('完成分享提纲','完成分享提綱','Finish the talk outline'),L('继续读《老人与海》','繼續讀《老人與海》','Continue The Old Man and the Sea')]
    for i,t in enumerate(tasks):
        y=367+i*64
        p += [rect(382,y-20,24,24,BLUE if i<2 else '#fff',6,BLUE if i<2 else '#cbd4de')]
        if i<2:p.append(text(394,y,'✓',19,'#fff','middle'))
        p.append(text(424,y,t,25,'#8993a0' if i<2 else '#46515e',width=690))
    p += [rect(925,707,220,45,'#edf4ff',22),text(1035,737,L('导出 PDF','匯出 PDF','Export PDF'),22,BLUE,'middle')]
    return p

def reading():
    p=base(file(12))
    p += [rect(58,114,1130,670,'#eff1f4'),rect(130,150,750,590,'#fff',3),text(175,215,L('老人与海','老人與海','The Old Man and the Sea'),35,width=660),text(175,260,L('阅读与朗读示意','閱讀與朗讀示意','Illustrative reading passage'),18,'#9aa3ad')]
    for i,t in enumerate([L('合上忙碌的一天，给自己留一点阅读的时间。','合上忙碌的一天，給自己留一點閱讀的時間。','At the end of the day, make a little time to read.'),L('熟悉的声音响起，文字也有了新的节奏。','熟悉的聲音響起，文字也有了新的節奏。','A familiar voice gives the words a new rhythm.'),L('今天没读完的，明天可以接着读。','今天沒讀完的，明天可以接著讀。','Tomorrow, pick up where you left off.')]):
        y=340+i*95
        if i==1:p.append(rect(155,y-40,700,69,'#eef5ff',12,'#9fc2f2'))
        p.append(text(178,y,t,25,width=650))
    p += [rect(910,185,245,285,'#fff',15),circle(1032,250,34,'#edf4ff'),text(1032,258,'♫',28,BLUE,'middle'),text(1032,325,L('熟悉的声音','熟悉的聲音','A familiar voice'),25,anchor='middle',width=210),text(1032,370,L('参考音频','參考音訊','Reference audio'),20,'#8b97a5','middle'),text(1032,409,'voice-sample.m4a',19,'#6d7c8b','middle',width=210)]
    p += [rect(165,620,680,78,'#f8fbff',16),text(200,669,'Ⅱ',28,BLUE),text(260,668,L('正在朗读 · 接着上次继续','正在朗讀 · 接著上次繼續','Reading aloud · Resume your place'),23,width=520)]
    for i,h in enumerate((15,30,44,24,36,20,40)):
        p.append(rect(970+i*17,560-h/2,5,h,'#82ace4',3))
    p.append(text(1030,640,L('本地生成 · 本地朗读','本地產生 · 本地朗讀','Local voice · Local reading'),18,'#8b97a5','middle',width=225))
    return p

def import_scene():
    p=base(L('从手机导入','從手機匯入','Import from your phone'))
    p += [rect(120,165,330,570,'#fafbfc',35,'#dce3eb'),rect(140,220,290,450,'#fff',8),text(285,202,L('手机浏览器','手機瀏覽器','Phone browser'),19,'#7f8b98','middle')]
    p += icon(285,310,'IMG',90)+[text(285,400,file(17),24,anchor='middle',width=270),rect(165,459,240,54,'#edf4ff',27),text(285,495,L('发送到 Vorlinx','傳送到 Vorlinx','Send to Vorlinx'),23,BLUE,'middle',width=220)]
    p += [line(490,420,655,420),rect(690,175,440,545,'#f8faff',20),text(910,235,L('扫码，加入这组资料','掃碼，加入這組資料','Scan to add your files'),28,anchor='middle',width=390)]
    p += [rect(824,278,172,172,'#fff',12,'#dce5f1'),text(910,350,'QR',40,'#98a9bd','middle'),text(910,395,L('演示占位','示意位置','Placeholder'),17,'#9aa7b7','middle')]
    p += [text(910,509,L('同一局域网 · 二维码或链接','同一區域網路 · QR Code 或連結','Same local network · QR code or link'),21,'#7f8d9d','middle',width=400)]+icon(766,590,'IMG',52)
    p += [text(810,590,file(17),23,width=290),text(810,624,L('已加入资料库','已加入資料庫','Added to your library'),19,BLUE,width=290)]
    return p

def sharing():
    p=base(L('分享资料','分享資料','Share files'))
    p += [text(130,185,L('分享资料包','分享資料包','Share a collection'),32),text(130,240,L('工作效率分享','工作效率分享','Work efficiency collection'),27,width=950)]
    for i,n in enumerate((4,5,0)):
        y=315+i*83
        p += icon(165,y,('MD','PPT','PDF')[i],50)+[text(215,y+7,file(n),26,width=450)]
    p += [rect(735,275,365,370,'#f7f9fc',17)]
    for i,(a,b) in enumerate(((L('访问密码','存取密碼','Password'),'••••••'),(L('有效期','有效期限','Expiry'),L('30 分钟','30 分鐘','30 minutes')),(L('访问范围','存取範圍','Access'),L('同一局域网','同一區域網路','Local network')))):
        y=325+i*105
        p += [text(765,y,a,22,'#7c8b9a',width=300),text(765,y+38,b,26,width=300)]
    p += [rect(130,680,310,58,BLUE,29),text(285,718,L('开启局域网分享','開啟區域網路分享','Start local sharing'),25,'#fff','middle',width=275),text(475,718,L('由你开启，随时停止。','由你開啟，隨時停止。','Start when you choose. Stop anytime.'),22,'#7e8d9d',width=620)]
    return p

def recipient():
    p=base(L('接收方浏览器','接收方瀏覽器','Recipient browser'))
    p += [text(130,190,L('工作效率分享','工作效率分享','Work efficiency collection'),34,width=950),text(130,240,L('密码验证后，查看分享的资料。','密碼驗證後，查看分享的資料。','Shared files after password verification.'),24,'#8793a0',width=950)]
    for i,n in enumerate((4,5,0)):
        y=330+i*125
        p += [rect(125,y-45,970,100,'#f8fafc',13)]+icon(182,y,('MD','PPT','PDF')[i],60)
        p += [text(240,y+8,file(n),29,width=600),text(1045,y+8,L('下载','下載','Download'),24,BLUE,'end')]
    p += [text(130,745,L('局域网访问 · 到期自动失效','區域網路存取 · 到期自動失效','Local network access · Expires automatically'),23,'#7e8d9d',width=950)]
    return p

def backup():
    p=base(L('加密备份','加密備份','Encrypted backup'))
    p += [rect(140,165,970,570,'#fafbfc',20),circle(210,235,30,'#eaf2ff'),text(210,245,'✓',28,BLUE,'middle'),text(270,230,L('加密后，再保存。','加密後，再儲存。','Encrypt first. Then save.'),32,width=750),text(270,270,L('备份你自己的资料库','備份你自己的資料庫','Back up your personal library'),24,'#7d8b99',width=750)]
    rows=[(L('备份位置','備份位置','Backup location'),'… / Vorlinx Backups'),(L('备份方式','備份方式','Backup method'),L('自动备份 · 加密保存','自動備份 · 加密儲存','Automatic · Encrypted')),(L('保存范围','儲存範圍','Contents'),L('个人文件与应用数据','個人檔案與應用資料','Personal files and app data'))]
    for i,(a,b) in enumerate(rows):
        y=365+i*110
        p += [text(185,y,a,22,'#85919f',width=860),text(185,y+40,b,28,width=860)]
    return p

def search():
    p=[rect(0,0,1200,600,'#f5f5f5',18),rect(20,50,1160,530,'#fff',14)]
    for x,c in ((24,'#ff6157'),(45,'#febc2e'),(66,'#28c840')):p.append(circle(x,23,5,c))
    p += [text(600,29,'Vorlinx',15,'#747c84','middle'),text(68,108,L('自然语言搜索','自然語言搜尋','Natural language search'),26)]
    p += [rect(65,140,1070,72,'#f7faff',18,'#c9dcf7'),text(94,185,L('那张讲注意力分散的图片','那張講注意力分散的圖片','The image about getting distracted'),28,width=930)]
    p += [text(68,260,L('从资料内容中查找','從資料內容中尋找','Find by what is inside'),20,'#85909d')]
    for i,(n,kind,desc) in enumerate(((6,'IMG',L('图片里的文字与视觉内容','圖片裡的文字與視覺內容','Text and visual content in an image')),(0,'PDF',L('相关的阅读资料','相關的閱讀資料','Related reading material')))):
        y=340+i*140
        p += [rect(65,y-48,1070,110,'#fafbfc',13)]+icon(128,y,kind,64)
        p += [text(185,y-4,file(n),28,width=890),text(185,y+34,desc,20,'#8b96a3',width=890)]
    return p

SCENES={'link':link_canvas,'groups':groups,'pdf':pdf,'files':files,'reading':reading,'search':search,'import':import_scene,'sharing':sharing,'recipient':recipient,'backup':backup}

def main():
    global LOCALE
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--overwrite',action='store_true')
    args=parser.parse_args()
    renderer=shutil.which('rsvg-convert')
    if not renderer:raise SystemExit('Install rsvg-convert to regenerate concept PNGs.')
    for LOCALE,locale in enumerate(LOCALES):
        dest=ROOT/'assets'/locale
        dest.mkdir(parents=True,exist_ok=True)
        for name,draw in SCENES.items():
            png=dest/f'{name}.png'
            if png.exists() and not args.overwrite:
                print(f'Preserved {locale}/{png.name}')
                continue
            w,h=(1600,1000) if name=='link' else (1200,600) if name=='search' else (1200,800)
            svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><g font-family="Hiragino Sans GB, Heiti TC, Arial Unicode MS, sans-serif">'+''.join(draw())+'</g></svg>'
            subprocess.run([renderer,'--format','png','--output',str(png)],input=svg.encode(),check=True)
            print(f'Created {locale}/{png.name}')
if __name__=='__main__':main()
