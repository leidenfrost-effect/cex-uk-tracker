# 🎮 CeX UK Game Price Tracker & Travel Shopping Basket

İngiltere seyahatiniz öncesinde **CeX UK (`uk.webuy.com`)** mağazalarındaki **PS5, PS4, Xbox Series X/S, Xbox One ve Xbox 360** oyunlarının fiyatlarını canlı takip etmek, seyahat bütçenizi planlamak ve öncelikli alışveriş sepeti oluşturmak için geliştirilmiş modern web uygulaması.

---

## 🌟 Temel Özellikler

- **5 Platform Desteği:** PlayStation 5, PlayStation 4, Xbox Series X/S, Xbox One ve Xbox 360 için kategori filtreleme ve anlık arama.
- **Çift Para Birimi (GBP £ & TRY ₺):** Canlı döviz kuru ile anlık TL çevirimi + Bankanızın yurt dışı kart kuruna göre **manuel kur belirleme**.
- **İngiltere Seyahat Sepeti & Bütçe Planlayıcı:**
  - Öncelik etiketleri (🔥 *Kesin Alınacak*, ⭐ *Yüksek Öncelik*, 👍 *Fiyatı Uygunsa*, 🎯 *Alternatif*).
  - Seyahat bütçesi belirleme (örn. £300) ve harcama limit çubuğu.
  - Hedef CeX Londra / UK mağazası atama (Tottenham Court Rd, Oxford St, Camden vb.).
  - Mağazada gezerken diski aldığınızda işaretleyebileceğiniz **"Satın Alındı" kontrol kutusu**.
  - Seyahatte internetsiz kullanım için **Tek Tıkla Yazdırılabilir / PDF Seyahat Kontrol Listesi** ve **CSV/Excel İndirme**.
- **Günlük Fiyat Takibi & Fiyat Geçmişi:**
  - Oyunların tarihsel fiyat değişim grafiği ve en dip fiyat indikatörleri.
  - Günün en çok düşen fiyatları ve 10 £ altı kelepir oyunlar paneli.
  - CeX Cash (Nakit) ve Voucher (Kupon) geri alım takas değerleri.
- **Otomasyon & Güncelleme:**
  - Uygulama içi tek tıkla yeni oyun ekleme ve fiyat düzenleme.
  - Günlük otomatik fiyat çekimi için hazır **GitHub Actions Cron Workflow** (`.github/workflows/daily-price-tracker.yml`).
  - Yerel kazıma scripti (`scripts/scrape_cex.py`).

---

## 🚀 Vercel'e Nasıl Deploy Edilir? (1-Tık Dağıtım)

Projeyi Vercel'de yayınlamak için aşağıdaki iki yöntemden birini kullanabilirsiniz:

### Yöntem 1: GitHub ile Dağıtım (Önerilen)
1. Bu projeyi bir GitHub reposuna yükleyin:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CeX UK Game Tracker"
   git remote add origin https://github.com/KULLANICI_ADINIZ/cex-uk-tracker.git
   git branch -M main
   git push -u origin main
   ```
2. [Vercel Dashboard](https://vercel.com/new)'a gidin.
3. Reponuzu seçip **Deploy** butonuna tıklayın.
4. Sıfır ayarla birkaç saniyede canlıya alınacaktır!
*(Her gün gece 00:00'da GitHub Actions otomatik fiyatları kontrol edip repoya commit atacak ve Vercel otomatik güncellenecektir).*

### Yöntem 2: Vercel CLI ile Dağıtım
Terminalden doğrudan Vercel'e göndermek için:
```bash
npx vercel
```
*(Gelen sorulara Enter diyerek onaylayın, anında canlı URL'iniz oluşturulur).*

---

## 💻 Yerel Geliştirme (Local Development)

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```
Tarayıcınızda `http://localhost:3000` adresini açın.

---

## 🛠️ Klasör Yapısı

```
├── .github/workflows/      # Günlük otomatik fiyat takip cron iş akışı
├── scripts/
│   └── scrape_cex.py       # CeX UK kazıma ve fiyat güncelleme scripti
├── src/
│   ├── app/                # Next.js 14 App Router sayfaları ve API rotaları
│   │   ├── api/exchange-rate/ # Canlı GBP -> TRY kur servisi
│   │   ├── api/games/         # Oyun veri API'si
│   │   ├── globals.css        # Tailwind & Print stilleri
│   │   ├── layout.tsx         # Kök düzen
│   │   └── page.tsx           # Ana uygulama paneli
│   ├── components/         # Modüler UI bileşenleri (Header, GameCard, BasketModal, vb.)
│   ├── context/            # AppContext (Sepet, Bütçe, Filtreler, LocalStorage)
│   ├── data/               # Önceden yüklenmiş zengin CeX oyun verisi ve mağazalar
│   ├── lib/                # Para birimi, indirim ve stil yardımcı fonksiyonları
│   └── types/              # TypeScript veri modelleri
├── vercel.json             # Vercel yapılandırması
└── package.json
```

---

## 🇬🇧 İngiltere Seyahati İçin CeX Alışveriş İpuçları

1. **Diski Kontrol Edin:** CeX mağazalarında kutular vitrinde boştur. Kasada diski zarftan çıkartırlar; ödeme yapmadan önce diskte kılcal çizik veya leke olmadığını mutlaka gözünüzle kontrol edin.
2. **Region Free:** PS4, PS5 ve Xbox Series X/One oyunları bölge kilitsizdir, Türkiye konsollarında sorunsuz çalışır.
3. **24 Ay Garanti:** CeX UK'den aldığınız tüm oyunlar ve cihazlar 24 ay mağaza garantilidir. Fişinizi saklamayı unutmayın.
