import re

def extract():
    with open('D:/AARON/Antigravity/workflow_tramites/Metricas_Software_TikTok.html', 'r', encoding='utf-8') as f:
        html = f.read()
    # pdf2htmlEX puts text in <div class="... t ...">...</div> or <div class="c ...">...</div> but usually class "t"
    texts = re.findall(r'<div[^>]*class="[^"]*\bt\b[^"]*"[^>]*>(.*?)</div>', html)
    plain = [re.sub(r'<[^>]+>', '', t) for t in texts]
    if not plain:
        # maybe just <div class="c ..."> 
        texts = re.findall(r'<div[^>]*class="[^"]*\bc\b[^"]*"[^>]*>(.*?)</div>', html)
        plain = [re.sub(r'<[^>]+>', '', t) for t in texts]
        
    if not plain:
        plain = [re.sub(r'<[^>]+>', ' ', html)]
        
    text = '\n'.join(plain)
    text = re.sub(r'\s+', ' ', text)
    print(text[:4000])

extract()
