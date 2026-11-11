# Langkah

Aplikasi latihan lari untuk iOS dan Android, dibuat dengan Expo (React Native, New Architecture). UI-nya memakai komponen native: tab bar sistem (liquid glass di iOS 26, Material 3 di Android), header stack native, SF Symbols / Material Symbols, dan Apple Maps / Google Maps. Logika JavaScript dikompilasi ke Hermes bytecode.

"Langkah" adalah nama kerja. Ikon dan splash di `assets/` masih bawaan Expo dan perlu diganti sebelum rilis.

## Fitur

**Program latihan**
- Onboarding: target (5K, 10K, half marathon, marathon, atau tanpa lomba), kebugaran saat ini dari hasil lomba/time trial atau dari kebiasaan lari, hari lari (2 sampai 6), hari lari jauh, durasi 4 sampai 24 minggu.
- Program berperiode: fase dasar, bangun, puncak, tapering, dengan minggu ringan tiap minggu ke-4 dan kenaikan volume maksimal 10% per minggu.
- Sesi: lari santai, pemulihan, lari jauh (dengan finish di pace lomba untuk half/marathon), strides, fartlek, progresif, tempo, cruise interval, interval, latihan pace lomba, dan hari lomba.
- Semua pace dihitung dari skor VDOT (rumus Jack Daniels). Prediksi waktu lomba untuk 5K sampai marathon.
- Hari latihan berat tidak ditempatkan berdampingan dan tidak menempel ke lari jauh.

**Adaptif**
- Setelah lari, pelari memberi skor usaha (RPE 1 sampai 10). Kalau terasa jauh lebih berat dari seharusnya, skor kebugaran turun; kalau repetisi kerja lebih cepat dari target dengan usaha wajar, skor naik. Semua pace berikutnya ikut berubah.
- Kalau 2 lari atau lebih terlewat dalam 14 hari, aplikasi menawarkan menurunkan pace sedikit.
- Latihan bisa dipindah ke hari lain dalam minggu yang sama (bertukar dengan lari yang ada), dilewati, atau dikembalikan.
- Skor kebugaran bisa diperbarui dari hasil lomba baru atau digeser manual.

**Perekaman lari**
- GPS dengan filter akurasi (> 25 m dibuang), filter lompatan (> 11 m/s), dan filter getaran saat diam.
- Tetap merekam saat layar terkunci: task lokasi background di iOS dan foreground service di Android (perlu izin lokasi "Selalu"; tanpa itu jatuh ke perekaman saat aplikasi terbuka).
- Panduan suara (Bahasa Indonesia atau Inggris): pergantian step dengan target pace, split per km/mil, peringatan terlalu cepat/lambat, plus getaran.
- Layar lari: waktu, jarak, pace saat ini, pace rata-rata, step aktif dengan sisa jarak/waktu, lane chart progres, peta live. Jeda, lanjut, lewati step, selesai.
- Layar tetap menyala selama lari.

**Riwayat dan statistik**
- Detail lari: peta rute, split dengan bar kecepatan, hasil per step latihan, tanjakan total, RPE, catatan, ekspor GPX (share sheet), hapus.
- Halaman Kamu: skor kebugaran, prediksi lomba, tabel pace latihan, grafik jarak 12 minggu, total bulan ini, minggu beruntun, usaha terbaik (1 km, 1 mil, 5K, 10K, half, marathon) yang dihitung dari rute GPS, dan riwayat perubahan kebugaran.

**Pengaturan**: km/mil, Bahasa Indonesia/English/ikuti sistem, tema terang/gelap/ikuti sistem, panduan suara, umumkan split, peringatan pace, hapus semua data.

Semua data disimpan lokal di ponsel (SQLite lewat `expo-sqlite`). Tidak ada akun atau server.

## Menjalankan

```bash
npm install
npm test            # 33 unit test untuk logika latihan dan perekaman
npm run typecheck
```

Background location dan beberapa modul native butuh development build, bukan Expo Go:

```bash
npx eas-cli@latest build --profile development --platform ios     # atau android
npx expo start --dev-client
```

Atau build lokal dengan `npm run ios` / `npm run android` (butuh Xcode / Android Studio).

Untuk peta Google di build Android, set `GOOGLE_MAPS_ANDROID_API_KEY` sebelum build. Tanpa key, rute digambar dengan SVG. iOS memakai Apple Maps dan tidak butuh key.

`npx expo start --web` menjalankan versi web untuk pratinjau cepat. Di web, peta digambar dengan SVG dan perekaman hanya berjalan selama tab terbuka.

## Struktur

```
src/app/         rute Expo Router saja
src/screens/     isi tiap layar
src/components/  komponen UI bersama (lane chart, peta rute, grafik, tombol)
src/lib/         logika murni + tes: VDOT, generator program, engine lari, statistik, adaptasi, GPX
src/services/    lokasi background, panduan suara, dialog konfirmasi
src/store/       state persisten (zustand + expo-sqlite)
src/i18n/        teks Bahasa Indonesia dan Inggris
DESIGN.md        arah visual dan alasan setiap keputusan desain
.claude/skills/  skill antislop (miqdadbadjuber/anti-slop, MIT)
```

## Belum ada

Dibanding Runna, yang belum dibuat: sinkron jam (Apple Watch, Garmin, COROS), sinkron Strava/Apple Health/Health Connect, latihan kekuatan, akun dan sinkron cloud, fitur sosial, dan pembayaran. Aplikasi belum diuji di perangkat iOS atau Android fisik; pengujian sejauh ini adalah unit test, bundling Hermes untuk kedua platform, prebuild native, dan click-through versi web di viewport ponsel dengan GPS disimulasikan.
