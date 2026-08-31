# CeX UK Game Price Tracker

CeX UK üzerindeki PS5, PS4, Xbox Series X/S, Xbox One ve Xbox 360 oyunlarını takip eden Next.js uygulaması. Katalog GitHub Actions üzerinde Playwright ile doğrulanır, fiyat ve stok değişiklikleri Neon Postgres'e yazılır, GBP/TRY kuru TCMB döviz satış kaynağından alınır.

## Mimari

- **Web:** Next.js 16 App Router, Vercel
- **Veri:** Neon Postgres
- **Katalog kaynağı:** CeX UK sitesinin kullandığı Algolia arama akışı
- **Kur kaynağı:** TCMB `GBP ForexSelling / Unit`
- **Otomasyon:** Her gün 15:00 UTC (18:00 Türkiye) ve isteğe bağlı GitHub Actions çalıştırması
- **Kişisel veriler:** Sepet, bütçe, notlar ve özel oyunlar yalnızca tarayıcının `localStorage` alanında tutulur

Scraper beş platformu ve katalog bütünlüğünü doğrulamadan veritabanını değiştirmez. Eksik veya karışmış sonuçlar eski doğru verinin üzerine yazılmaz.

## 1. Neon ve Vercel kurulumu

1. Vercel Marketplace üzerinden bir Neon Postgres veritabanı oluşturup projeye bağlayın.
2. Neon SQL Editor'da [`db/migrations/001_initial.sql`](db/migrations/001_initial.sql) dosyasını çalıştırın. Alternatif olarak yerelde `python scripts/migrate_db.py` kullanabilirsiniz.
3. `.env.example` dosyasını `.env.local` olarak kopyalayıp gerçek değerleri girin.
4. Vercel Project Settings → Environment Variables bölümüne şunları ekleyin:
   - `DATABASE_URL`
   - `ADMIN_REFRESH_SECRET`
   - `GITHUB_ACTIONS_TOKEN`
   - `GITHUB_REPOSITORY=leidenfrost-effect/cex-uk-tracker`
   - `GITHUB_WORKFLOW_FILE=daily-price-tracker.yml`
   - `GITHUB_DEFAULT_BRANCH=main`

`GITHUB_ACTIONS_TOKEN`, yalnızca bu repo için **Actions: Read and write** yetkili fine-grained token olmalıdır. Token hiçbir zaman istemci tarafına gönderilmez.

## 2. GitHub Actions kurulumu

GitHub repo Settings → Secrets and variables → Actions bölümüne `DATABASE_URL` secret'ını ekleyin. Workflow:

- PostgreSQL migration'ını uygular.
- Chromium ve Playwright'ı kurar.
- CeX kategorilerini canlı facet verisinden keşfeder.
- Beş platformu doğrular ve tek işlemde Neon'a yazar.
- TCMB kuru alınamazsa oyun verisini `partial` durumuyla korur ve son doğru kuru değiştirmez.

İlk veriyi oluşturmak için Actions → **CeX UK Daily Price Tracker** → **Run workflow** çalıştırın.

## 3. Yerel geliştirme

```powershell
npm install
python -m pip install -r requirements.txt
playwright install chromium
Copy-Item .env.example .env.local
python scripts/migrate_db.py
npm run dev
```

Tarayıcı: `http://localhost:3000`

### Yerel PostgreSQL ile test

Docker Desktop ve Docker Compose ile yerel veritabanını başlatın:

```powershell
docker compose up -d postgres
$env:DATABASE_URL = "postgresql://cex_local:cex_local@localhost:5433/cex_tracker?sslmode=disable"
$env:DB_DRIVER = "postgres"
python scripts/migrate_db.py
```

Web uygulamasının yerel veritabanını kullanması için `.env.local` dosyasında da `DB_DRIVER=postgres` ve yukarıdaki `DATABASE_URL` değerleri bulunmalıdır. Geliştirme sunucusunu yeniden başlatın.

Gerçek CeX katalog verisini ve TCMB kurunu yerel veritabanına almak için:

```powershell
$env:DATABASE_URL = "postgresql://cex_local:cex_local@localhost:5433/cex_tracker?sslmode=disable"
$env:DB_DRIVER = "postgres"
python scripts/scrape_all_cex.py
```

Production/Neon ortamında `DB_DRIVER=neon` kullanılır.

Canlı veriyi veritabanına yazmadan doğrulamak için:

```powershell
python scripts/scrape_all_cex.py --platforms PS5 --dry-run
python scripts/scrape_all_cex.py --dry-run
```

Tam senkronizasyon:

```powershell
python scripts/scrape_all_cex.py
```

## Kontroller

```powershell
npm run typecheck
npm run lint
npm run test:scraper
npm run build
```

## API özeti

- `GET /api/games` — katalog, filtreler ve sayfalama
- `GET /api/games/:id/history` — değişiklik bazlı fiyat/stok geçmişi
- `GET /api/trends` — fiyat düşüşleri ve uygun fiyatlı oyunlar
- `GET /api/exchange-rate` — son doğrulanmış TCMB GBP/TRY kuru
- `POST /api/admin/refresh` — admin parolasıyla GitHub workflow tetikleme
- `GET /api/sync-status` — son senkronizasyon durumu

## Veri davranışı

- Değişmeyen fiyatlar için her gün yeni satır üretilmez; günlük kontrol `sync_runs` tablosunda kayıtlıdır.
- Satış, nakit, kupon veya stok değiştiğinde `game_state_changes` kaydı oluşur.
- Tam taramada kaybolan ürün silinmez; pasif ve stok dışı işaretlenir.
- Kısmi/başarısız tarama ürünleri topluca stok dışı yapmaz.
- Sabit veya uydurma kur ve stok fallback değeri kullanılmaz.
