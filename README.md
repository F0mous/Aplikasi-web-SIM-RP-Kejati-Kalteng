# SIM-RP Kejati Kalteng

Aplikasi web **Sistem Evaluasi Reward & Punishment Pegawai** untuk Kejaksaan Tinggi Kalimantan Tengah.

Aplikasi ini menggunakan satu dashboard Administrator dan mengolah:

1. Kehadiran kerja dari file Excel.
2. Kehadiran apel dari file Excel.
3. Nilai audit kelengkapan mySIMKARI yang diinput manual.
4. Rekap bulanan per pegawai.
5. Skor otomatis berbasis bobot, penalti, dan ambang rekomendasi.
6. Rekomendasi kandidat reward, kinerja baik, pembinaan, teguran, atau evaluasi disiplin.
7. Cetak laporan PDF dan export Excel.
8. Histori audit aktivitas administrator.

## Teknologi

- React + TypeScript
- Vite
- IndexedDB melalui Dexie
- SheetJS untuk import/export Excel
- jsPDF + AutoTable untuk laporan PDF
- GitHub Actions untuk deployment GitHub Pages

## Login awal

```text
Username: admin
Password: admin123
```

Segera ubah password dari menu **Pengaturan Skor** setelah login.

## Rumus nilai awal

Bobot default:

| Komponen | Bobot |
|---|---:|
| Kehadiran kerja | 40% |
| Kehadiran apel | 25% |
| Audit mySIMKARI | 35% |

Penalti default:

| Kejadian | Pengurangan |
|---|---:|
| Alpa | 10 poin |
| Terlambat kerja | 2 poin |
| Pulang cepat | 2 poin |
| Tidak absen | 2 poin |
| Tidak hadir apel | 5 poin |
| Terlambat apel | 2 poin |

Rumus:

```text
Nilai Kehadiran = 100 - seluruh penalti kehadiran
Nilai Apel      = 100 - seluruh penalti apel

Nilai Akhir =
(Nilai Kehadiran × 40%)
+ (Nilai Apel × 25%)
+ (Nilai mySIMKARI × 35%)
```

Sistem hanya menerbitkan nilai akhir dan rekomendasi apabila ketiga komponen tersedia pada periode yang dipilih.

Ambang rekomendasi default:

| Nilai akhir | Rekomendasi |
|---:|---|
| ≥ 90 | Kandidat Reward |
| 80–89,99 | Kinerja Baik |
| 70–79,99 | Pembinaan & Monitoring |
| 60–69,99 | Rekomendasi Teguran |
| < 60 | Evaluasi Disiplin |

Semua bobot, penalti, dan ambang dapat diubah dari dashboard Administrator.

## Format import Excel

Aplikasi menyediakan tombol **Download Template** pada setiap jenis import.

### Master pegawai

Header:

```text
nip | nama | jabatan | unit | status
```

Status: `Aktif` atau `Nonaktif`.

### Kehadiran kerja

Header:

```text
nip | tanggal | status | jam_masuk | jam_pulang | keterangan
```

Status yang didukung:

```text
Hadir
Terlambat
Alpa
Izin
Sakit
Cuti
Dinas Luar
Pulang Cepat
Tidak Absen
```

### Kehadiran apel

Header:

```text
nip | tanggal | status | keterangan
```

Status yang didukung:

```text
Hadir
Terlambat
Tidak Hadir
```

Format tanggal: `YYYY-MM-DD` atau `DD/MM/YYYY`.

## Menjalankan di komputer

Persyaratan:

- Node.js 22 atau yang kompatibel dengan Vite 8
- npm

Perintah:

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya:

```text
http://localhost:5173
```

Build produksi:

```bash
npm run build
npm run preview
```

## Deploy ke GitHub Pages

Workflow deployment sudah tersedia di:

```text
.github/workflows/deploy.yml
```

Langkah:

1. Buat repository baru di GitHub.
2. Upload seluruh isi folder project ini ke repository.
3. Pastikan branch utama bernama `main`.
4. Buka **Settings → Pages**.
5. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
6. Push perubahan ke branch `main`.
7. Buka tab **Actions** untuk melihat proses build dan deployment.
8. Setelah selesai, URL aplikasi tampil di halaman Settings → Pages.

Contoh perintah Git:

```bash
git init
git add .
git commit -m "Initial commit SIM-RP Kejati Kalteng"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPOSITORY.git
git push -u origin main
```

## Database dan batasan GitHub Pages

Versi ini memakai **IndexedDB**, yaitu database lokal di browser.

Kelebihan:

- Bisa langsung dipakai tanpa server.
- Data tetap tersimpan setelah browser ditutup.
- Cocok untuk demo, prototipe, penggunaan satu admin pada satu perangkat, dan deployment GitHub Pages.

Batasan:

- Data tidak otomatis tersinkron antar komputer.
- Menghapus data browser dapat menghapus database lokal.
- GitHub Pages tidak menjalankan server database.
- Login client-side tidak setara dengan autentikasi server untuk penggunaan produksi yang sensitif.

Untuk penggunaan resmi multi-user/lintas perangkat, migrasikan lapisan database ke PostgreSQL/MySQL/Supabase atau API internal, lalu gunakan autentikasi server/SSO instansi.

## Struktur project

```text
src/
├── components/
│   ├── AppShell.tsx
│   └── ui.tsx
├── data/
│   └── defaults.ts
├── db/
│   └── database.ts
├── pages/
│   ├── AuditPage.tsx
│   ├── DashboardPage.tsx
│   ├── EmployeesPage.tsx
│   ├── ImportPage.tsx
│   ├── LoginPage.tsx
│   ├── MySimkariPage.tsx
│   ├── RecapPage.tsx
│   └── SettingsPage.tsx
├── services/
│   ├── auth.ts
│   ├── excel.ts
│   ├── pdf.ts
│   └── scoring.ts
├── App.tsx
├── main.tsx
├── styles.css
└── types.ts
```

## Catatan kebijakan

Rekomendasi sistem adalah keluaran analitis berdasarkan data dan ambang yang dikonfigurasi. Rekomendasi tidak otomatis menjadi keputusan penghargaan atau hukuman resmi. Verifikasi administratif dan keputusan tetap mengikuti ketentuan serta kewenangan yang berlaku.
