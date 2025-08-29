
# Namaz Vakitleri — Cloudflare Pages

Tek sayfalık (static) bir uygulama + **Pages Functions** ile AlAdhan API proxy'si.

## Klasör Yapısı

```
/functions/api/namaz.js    → GET /api/namaz?city=Ankara&date=2025-08-30
/assets/style.css
/assets/app.js
/assets/cities-tr.json
/index.html
```

## Çalışma

- Kullanıcı şehir seçer → `localStorage`'a kaydedilir.
- URL `/{slug}/` formatına güncellenir (SEO & paylaşım).
- Frontend, backend'e `/api/namaz?city=<Şehir>` çağrısı yapar.
- Backend (Cloudflare Functions) AlAdhan API'den **Diyanet** yöntemiyle veriyi alır ve 30 dk cache eder.

## Cloudflare Pages Deploy

- **Project Type**: Git bağlantısı veya "Direct Upload".
- **Build command**: `echo skip` (ya da boş bırakılabiliyorsa boş).
- **Build output directory**: `/` (root). 
- **Functions**: `functions/` klasörünü otomatik algılar.
- **Production branch**: main.

> Not: Bazı UI'larda "Deploy command" boş bırakılamıyor. Bu durumda `echo done` yazabilirsiniz. Build ve deploy, static içerik olduğu için çok hızlıdır.

## SEO Notları

- `index.html` içinde **JSON-LD (WebPage)** var ve şehir seçimiyle dinamik güncellenir.
- Şehir slug'ları `/ankara/`, `/istanbul/` gibi path'te görünür.
- Daha ileri SEO için (opsiyonel): GitHub Actions ile 81 şehir için statik HTML üretip `/{slug}/index.html` dosyaları olarak yayınlanabilir.

## Geliştirme

Yerelde test için herhangi bir static server yeterlidir (örn. `python -m http.server`). Functions uç noktası yerelde Wrangler ile çalıştırılabilir.
