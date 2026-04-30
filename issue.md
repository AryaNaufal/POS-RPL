# Planning Implementasi Dashboard Berdasarkan Role

## Judul Proyek
Perancangan Sistem Informasi Point of Sale (POS) pada Toko UMKM untuk Meningkatkan Efektivitas Pengelolaan Transaksi Menggunakan Model SDLC Waterfall

## Tujuan Dokumen
Dokumen ini menjadi acuan implementasi perbaikan tampilan dashboard agar sesuai dengan role masing-masing pengguna.

Fokusnya adalah:
- dashboard admin menampilkan area admin
- dashboard kasir menampilkan area kasir
- tampilan, menu, dan data yang muncul harus berbeda sesuai role
- tahapan kerja dibuat jelas agar bisa dikerjakan oleh junior programmer atau model AI yang lebih murah

## Masalah Yang Ingin Diselesaikan
Saat ini dashboard masih cenderung campur antara kebutuhan admin dan kasir.

Akibatnya:
- user melihat menu yang tidak relevan dengan rolenya
- navigasi menjadi tidak fokus
- area kerja admin dan kasir kurang tegas
- struktur UI sulit dikembangkan untuk fitur berikutnya

## Target Akhir
Setelah implementasi selesai:
- user dengan role admin masuk ke area admin
- user dengan role kasir masuk ke area kasir
- halaman dashboard awal melakukan redirect sesuai role
- setiap role memiliki layout, menu, dan ringkasan data yang berbeda

## Scope Fitur
Planning ini hanya membahas pemisahan dashboard berdasarkan role.

Termasuk di dalam scope:
- penentuan role setelah login
- redirect ke dashboard yang sesuai
- layout khusus admin
- layout khusus kasir
- menu khusus tiap role
- data ringkasan khusus tiap role
- proteksi route berdasarkan role

Tidak wajib pada issue ini:
- penambahan role baru
- multi-store penuh
- permission granular per fitur
- laporan lanjutan
- desain ulang seluruh aplikasi

## Keputusan Teknis Yang Direkomendasikan
Gunakan pendekatan route terpisah untuk dashboard per role.

Contoh struktur yang disarankan:
- `/dashboard` sebagai halaman penentu arah
- `/dashboard/admin` untuk area admin
- `/dashboard/kasir` untuk area kasir

Gunakan layout yang berbeda untuk masing-masing area agar:
- menu mudah dipisahkan
- komponen lebih rapi
- pengembangan berikutnya tidak saling mengganggu

## Prinsip Implementasi
1. Admin dan kasir tidak memakai dashboard yang sama.
2. Setiap role hanya melihat menu yang relevan.
3. Ringkasan data di dashboard harus sesuai kebutuhan role.
4. Route harus diproteksi agar user tidak bisa masuk ke area role lain.
5. UI harus sederhana dan konsisten dengan gaya POS toko.

## Peran Masing-Masing Dashboard

### 1. Dashboard Admin
Area admin berisi pengelolaan sistem dan master data.

Isi yang cocok untuk admin:
- ringkasan omzet dan transaksi
- jumlah produk aktif
- stok menipis
- customer dan supplier
- shortcut ke master produk
- shortcut ke master kategori
- shortcut ke master satuan
- shortcut ke manajemen user
- shortcut ke laporan

### 2. Dashboard Kasir
Area kasir berisi operasional transaksi harian.

Isi yang cocok untuk kasir:
- ringkasan transaksi hari ini
- omzet hari ini
- akses cepat ke tambah transaksi
- daftar transaksi terbaru
- status shift atau aktivitas kasir
- informasi store aktif

## Tahapan Implementasi

### 1. Audit struktur dashboard saat ini
Tujuan: memahami komponen yang masih campur antara admin dan kasir.

#### File yang dibaca
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/admin/page.tsx`
- `src/app/dashboard/kasir/page.tsx`
- `src/app/dashboard/admin/layout.tsx`

#### Yang harus dipahami
- halaman mana yang menjadi landing setelah login
- menu mana yang masih ditampilkan ke semua role
- data apa yang sebenarnya khusus admin
- data apa yang khusus kasir

#### Output
- daftar bagian UI yang harus dipisahkan

### 2. Tentukan pembagian route final
Tujuan: membuat struktur dashboard yang tidak membingungkan.

#### Keputusan yang disarankan
- `/dashboard` hanya untuk redirect
- `/dashboard/admin` untuk admin
- `/dashboard/kasir` untuk kasir

#### Output
- struktur route final disepakati sebelum coding

### 3. Buat aturan redirect berdasarkan role
Tujuan: setelah login, user langsung diarahkan ke dashboard yang tepat.

#### Task
- cek role user dari session atau assignment
- jika role admin, arahkan ke `/dashboard/admin`
- jika role kasir, arahkan ke `/dashboard/kasir`
- jika role tidak valid, tampilkan fallback yang aman

#### Acceptance Criteria
- admin tidak masuk ke dashboard kasir
- kasir tidak masuk ke dashboard admin
- halaman `/dashboard` tidak menampilkan UI campuran

### 4. Pisahkan layout admin dan kasir
Tujuan: setiap area punya identitas visual dan navigasi sendiri.

#### Task
- buat layout admin khusus
- buat layout kasir khusus
- tambahkan sidebar atau navigasi sesuai role
- sediakan tombol logout pada masing-masing area

#### Catatan
- layout admin boleh lebih lengkap
- layout kasir harus lebih ringkas dan fokus transaksi

#### Acceptance Criteria
- admin dan kasir punya layout berbeda
- navigasi tiap role lebih sederhana

### 5. Sederhanakan halaman dashboard admin
Tujuan: admin hanya melihat data yang berkaitan dengan pengelolaan toko.

#### Task
- tampilkan KPI admin
- tampilkan kartu akses cepat ke master data
- tampilkan stok menipis
- tampilkan transaksi ringkas jika diperlukan

#### Acceptance Criteria
- dashboard admin terasa seperti pusat kontrol
- menu operasional kasir tidak mendominasi halaman admin

### 6. Sederhanakan halaman dashboard kasir
Tujuan: kasir fokus pada transaksi harian.

#### Task
- tampilkan KPI kasir
- tampilkan tombol tambah transaksi
- tampilkan daftar transaksi terbaru
- tampilkan info shift atau store aktif

#### Acceptance Criteria
- dashboard kasir fokus pada pekerjaan transaksi
- user kasir tidak perlu melihat menu admin

### 7. Pisahkan menu berdasarkan role
Tujuan: user hanya melihat menu yang relevan.

#### Admin menu yang disarankan
- dashboard admin
- master produk
- kategori produk
- satuan produk
- customer
- supplier
- user role
- laporan

#### Kasir menu yang disarankan
- dashboard kasir
- tambah transaksi
- riwayat transaksi kasir

#### Acceptance Criteria
- menu admin dan kasir tidak bercampur
- struktur menu mudah dipelihara

### 8. Proteksi route berdasarkan role
Tujuan: user tidak bisa membuka area yang bukan haknya.

#### Task
- tambahkan pengecekan role pada route admin
- tambahkan pengecekan role pada route kasir
- redirect ke halaman yang sesuai jika akses tidak valid

#### Acceptance Criteria
- akses manual ke URL role lain ditolak
- data sensitif tidak bisa dibuka oleh role yang salah

### 9. Rapikan data ringkasan per role
Tujuan: data yang tampil sesuai kebutuhan kerja masing-masing role.

#### Admin
- omzet harian
- omzet bulanan
- produk aktif
- customer dan supplier
- low stock

#### Kasir
- transaksi hari ini
- omzet hari ini
- rata-rata transaksi
- daftar transaksi terbaru

#### Acceptance Criteria
- KPI tiap halaman relevan dengan peran pengguna

### 10. Uji manual end-to-end
Tujuan: memastikan redirect dan pemisahan dashboard berjalan benar.

#### Skenario Uji
1. login sebagai admin
2. pastikan masuk ke `/dashboard/admin`
3. login sebagai kasir
4. pastikan masuk ke `/dashboard/kasir`
5. akses manual dashboard role lain
6. pastikan ditolak atau diarahkan ulang
7. cek menu yang muncul hanya menu role tersebut

## Urutan Implementasi Teknis
Urutan kerja yang disarankan:
1. audit dashboard yang ada
2. tetapkan struktur route final
3. buat redirect berdasarkan role
4. pisahkan layout admin dan kasir
5. rapikan dashboard admin
6. rapikan dashboard kasir
7. pisahkan menu
8. tambahkan proteksi route
9. uji manual

## Pembagian Task Untuk Junior Programmer / AI Murah
Setiap task harus kecil dan spesifik.

### Format Task Yang Disarankan
- tujuan
- file yang diubah
- role yang terdampak
- route yang terdampak
- output yang diharapkan
- langkah uji manual

### Contoh Task Yang Baik
- buat redirect dashboard berdasarkan role
- buat layout admin terpisah
- buat layout kasir terpisah
- rapikan menu kasir
- rapikan menu admin

### Contoh Task Yang Terlalu Besar
- perbaiki semua dashboard aplikasi
- buat sistem role baru
- redesign semua halaman admin dan kasir sekaligus

## Daftar Issue Kecil Yang Direkomendasikan
1. Audit struktur dashboard saat ini
2. Tentukan route final untuk admin dan kasir
3. Buat redirect setelah login berdasarkan role
4. Buat layout khusus admin
5. Buat layout khusus kasir
6. Pisahkan menu admin dan kasir
7. Rapikan dashboard admin
8. Rapikan dashboard kasir
9. Proteksi route admin dan kasir
10. Uji manual flow dashboard berdasarkan role

## Backlog Per File
Bagian ini memecah pekerjaan menjadi issue kecil yang lebih aman untuk junior programmer atau model AI murah.

### 1. `src/app/dashboard/page.tsx`
Peran file ini harus dipersempit menjadi halaman penentu arah.

#### Tugas
- ubah halaman ini menjadi redirect based on role
- jangan tampilkan ringkasan campuran admin dan kasir
- jika role admin, arahkan ke `/dashboard/admin`
- jika role kasir, arahkan ke `/dashboard/kasir`
- jika role tidak ditemukan, arahkan ke fallback yang aman

#### Output yang diharapkan
- `/dashboard` tidak lagi menjadi halaman dashboard campuran

### 2. `src/app/dashboard/admin/layout.tsx`
Layout admin menjadi shell utama area admin.

#### Tugas
- pertahankan proteksi admin access
- rapikan struktur sidebar dan header admin
- pastikan navigasi admin hanya berisi menu admin
- sediakan tombol logout dan kembali ke dashboard bila diperlukan

#### Output yang diharapkan
- admin memiliki layout yang konsisten dan mudah dipakai

### 3. `src/app/dashboard/kasir/layout.tsx`
File ini perlu dibuat jika area kasir ingin punya layout sendiri.

#### Tugas
- buat layout kasir terpisah
- tampilkan navigasi kasir yang ringkas
- sediakan tombol logout
- arahkan kembali ke dashboard kasir jika user berada di area transaksi

#### Output yang diharapkan
- kasir memiliki shell UI tersendiri dan tidak bercampur dengan admin

### 4. `src/app/dashboard/admin/page.tsx`
Halaman ini menjadi ringkasan khusus admin.

#### Tugas
- tampilkan KPI admin
- tampilkan shortcut master data
- tampilkan stok menipis
- hilangkan elemen yang terlalu operasional untuk kasir

#### Output yang diharapkan
- admin melihat pusat kontrol toko, bukan dashboard campuran

### 5. `src/app/dashboard/kasir/page.tsx`
Halaman ini menjadi ringkasan khusus kasir.

#### Tugas
- tampilkan KPI harian kasir
- tampilkan tombol tambah transaksi
- tampilkan transaksi terbaru
- tampilkan informasi store aktif atau shift aktif

#### Output yang diharapkan
- kasir fokus ke transaksi harian

### 6. `src/components/admin/admin-nav.tsx`
Komponen ini harus dipastikan benar-benar hanya berisi menu admin.

#### Tugas
- cek daftar menu admin
- hapus menu yang bukan domain admin
- pastikan label dan urutan menu rapi

#### Output yang diharapkan
- navigasi admin jelas dan tidak bercampur

### 7. Komponen navigasi kasir
Jika belum ada, buat komponen baru untuk menu kasir.

#### Rekomendasi file
- `src/components/kasir/kasir-nav.tsx`

#### Tugas
- buat menu singkat untuk kasir
- isi menu hanya yang relevan dengan transaksi
- hindari menu master data dan laporan kompleks

#### Output yang diharapkan
- kasir punya navigasi ringkas yang mudah dipahami

### 8. `src/components/auth/auth-card.tsx`
Halaman login harus mengikuti redirect role setelah autentikasi berhasil.

#### Tugas
- pastikan hasil login mengarahkan user ke dashboard yang sesuai
- jika role tidak tersedia, tampilkan fallback aman
- jangan arahkan semua user ke satu dashboard yang sama

#### Output yang diharapkan
- login admin dan kasir menghasilkan tujuan yang berbeda

### 9. `src/app/api/login/route.ts`
API login harus mengembalikan informasi yang cukup untuk redirect role.

#### Tugas
- pastikan session atau response login memuat identitas role yang bisa dibaca frontend
- jika perlu, ambil role aktif dari assignment user-store-role

#### Output yang diharapkan
- frontend bisa memutuskan redirect tanpa logika yang berantakan

### 10. `src/lib/auth/*`
Jika perlu, buat helper kecil untuk pemetaan role dan redirect.

#### Rekomendasi file baru
- `src/lib/auth/role-redirect.ts`
- `src/lib/auth/role-guards.ts`

#### Tugas
- buat helper menentukan tujuan dashboard berdasarkan role
- buat helper validasi akses admin dan kasir

#### Output yang diharapkan
- logika role tidak disalin di banyak file

## Backlog Issue Berdasarkan Urutan Eksekusi
Urutan ini cocok untuk pengerjaan bertahap.

### Issue 1
Audit struktur dashboard dan identifikasi bagian yang campur.

### Issue 2
Buat helper redirect berdasarkan role.

### Issue 3
Ubah `/dashboard` menjadi halaman redirect.

### Issue 4
Rapikan layout admin.

### Issue 5
Buat layout kasir terpisah.

### Issue 6
Refactor halaman admin menjadi dashboard kontrol.

### Issue 7
Refactor halaman kasir menjadi dashboard operasional.

### Issue 8
Pisahkan menu admin dan kasir.

### Issue 9
Tambahkan proteksi route untuk admin dan kasir.

### Issue 10
Lakukan uji manual end-to-end.

## Format Issue Yang Disarankan
Setiap issue sebaiknya hanya berisi:
- tujuan
- file yang diubah
- input yang dibutuhkan
- output yang diharapkan
- acceptance criteria
- langkah uji manual

## Contoh Pembagian Issue Kecil

### Issue Kecil A
Ubah `src/app/dashboard/page.tsx` agar hanya melakukan redirect role.

### Issue Kecil B
Buat `src/app/dashboard/kasir/layout.tsx` dengan navigasi kasir ringkas.

### Issue Kecil C
Refactor `src/app/dashboard/kasir/page.tsx` agar hanya menampilkan KPI transaksi.

### Issue Kecil D
Pisahkan menu admin dari menu kasir di komponen navigasi.

### Issue Kecil E
Tambahkan guard akses role di area admin dan kasir.

## Skenario Uji Manual Minimal
- admin login masuk ke area admin
- kasir login masuk ke area kasir
- dashboard `/dashboard` tidak menampilkan UI campuran
- admin tidak bisa membuka area kasir
- kasir tidak bisa membuka area admin
- menu yang tampil sesuai role

## Definition of Done
Satu issue dianggap selesai jika:
- role routing berjalan benar
- layout sudah dipisahkan
- menu sudah relevan dengan role
- data dashboard sesuai role
- akses lintas role ditolak
- ada pengujian manual

## Catatan Penting Untuk Implementor
- jangan mempertahankan satu dashboard campuran
- jangan menampilkan menu admin ke kasir
- jangan menampilkan menu kasir ke admin jika tidak perlu
- jangan ubah struktur login tanpa alasan kuat
- jangan membuat route baru tanpa aturan redirect yang jelas

## Penutup
Target terbaik untuk perubahan ini adalah dashboard yang tegas pembagiannya:
- admin menjadi area kontrol sistem
- kasir menjadi area operasional transaksi

Dengan pembagian ini, UI lebih rapi, alur kerja lebih jelas, dan pengembangan fitur berikutnya lebih mudah dikerjakan secara bertahap.
