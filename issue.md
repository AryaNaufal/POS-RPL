# Planning Implementasi Scope Final POS UMKM

## Status Eksekusi Saat Ini (2026-04-16)
- [x] Role aktif dirapikan menjadi `admin` dan `kasir` pada jalur aktif.
- [x] Navigasi admin dibersihkan dari menu non-MVP (shift, expenses, settings, audit log).
- [x] Inventori disederhanakan ke stok + mutasi minimum (tanpa transfer/opname tab).
- [x] Laporan disederhanakan ke `sales + stocks + CSV` (tanpa profit/cash/purchases/PDF).
- [x] Flow sales aktif disederhanakan ke `completed` saja.
- [x] Flow purchase aktif disederhanakan ke `draft -> received` saja.
- [x] Jalur retur penjualan dan retur pembelian dihapus dari route aktif.
- [x] Halaman non-MVP (settings/expenses/audit) ditutup dengan redirect.
- [x] API non-MVP utama dikembalikan `410 Gone` agar tidak dipakai diam-diam.
- [x] Migrasi non-MVP dihapus: `0006`, `0007`, `0008`.

## Judul Proyek
Perancangan Sistem Informasi Point of Sale (POS) pada Toko UMKM untuk Meningkatkan Efektivitas Pengelolaan Transaksi Menggunakan Model SDLC Waterfall

## Tujuan Dokumen
Dokumen ini menjadi acuan implementasi untuk:
- menerapkan fitur pada poin no. 1
- menerapkan penyederhanaan aturan bisnis pada poin no. 3
- menghapus fitur dan migrasi pada poin no. 2

Dokumen ini ditulis agar bisa dikerjakan oleh junior programmer atau model AI yang lebih murah. Karena itu, scope harus tegas, langkah kerja harus berurutan, dan setiap task harus kecil.

## Keputusan Scope Final

### 1. Fitur Yang Harus Dipertahankan
- login manual
- role `admin` dan `kasir`
- master produk
- master kategori
- master satuan
- master customer
- master supplier
- penjualan kasir sederhana
- stok otomatis dari penjualan
- pembelian sederhana + receive barang
- dashboard ringkas
- laporan dasar penjualan dan stok
- logout

### 2. Fitur Yang Harus Dihapus / Ditunda
- multi-store penuh
- role per store yang granular
- transfer stok antar toko
- retur jual / retur beli
- stock opname massal
- refund kompleks
- draft sales lifecycle lengkap
- expected_cash dan cash_difference detail
- cash movement yang kompleks
- app settings yang banyak
- audit log before/after lengkap
- export PDF
- laporan laba kotor detail
- monitoring audit log UI penuh

### 3. Aturan Bisnis Yang Wajib Disederhanakan
- sistem berjalan sebagai `single store` terlebih dahulu
- role hanya `admin` dan `kasir`
- purchase hanya memakai alur `draft -> received`
- sales hanya memakai status `completed`
- tidak ada partial receive
- tidak ada partial refund
- laporan cukup memakai filter tanggal
- export cukup `CSV`, jangan `PDF`

## Prinsip Implementasi
- jangan kerjakan semua modul sekaligus
- jangan menyisakan UI yang masih mengarah ke fitur yang sudah dihapus
- jangan menyisakan route API yang masih membuka flow lama
- jangan menyisakan migration yang bertentangan dengan scope baru
- jangan biarkan type, route, komponen, dan migration saling tidak sinkron

## Target Hasil Akhir
Saat implementasi selesai, sistem harus bisa:
- login sebagai admin atau kasir
- logout dengan benar
- mengelola master produk, kategori, satuan, customer, dan supplier
- membuat transaksi penjualan sederhana oleh kasir
- mengurangi stok otomatis saat transaksi penjualan selesai
- membuat draft pembelian
- menerima pembelian dan menambah stok otomatis
- menampilkan dashboard ringkas
- menampilkan laporan penjualan dan laporan stok
- export laporan ke CSV

## Dampak Teknis Dari Keputusan Scope
Karena poin no. 2 harus dihapus, implementor tidak cukup hanya menyembunyikan menu. Implementor harus mengecek dan membersihkan:
- halaman UI
- komponen
- route API
- helper auth / permission
- type / interface
- migration SQL
- seed data
- dummy data
- link navigasi
- query dashboard

Jika tidak dibersihkan sampai level tersebut, aplikasi akan tampak sederhana di UI tetapi tetap rumit di belakang layar.

## Daftar Migrasi Yang Perlu Dievaluasi

### Migrasi Yang Perlu Dipertahankan
- migration auth manual user
- migration tabel inti POS yang benar-benar dipakai untuk MVP
- migration seed data yang masih relevan
- migration tambahan gambar produk jika memang tetap dipakai

### Migrasi Yang Harus Dihapus Karena Sesuai Poin No. 2
Minimal evaluasi dan hapus migration yang khusus untuk fitur berikut:
- transfer stok
- stock opname
- retur penjualan / retur pembelian

Contoh yang biasanya masuk kategori ini:
- `0006_create_stock_transfers_table.sql`
- `0007_create_stock_opname_tables.sql`
- `0008_add_return_columns.sql`

### Migrasi Yang Perlu Direvisi, Bukan Langsung Dihapus
Jika migration inti masih memuat fitur di luar scope, revisi isinya agar sesuai MVP. Bagian yang biasanya perlu direvisi:
- role `owner`
- status sales selain `completed`
- status purchase selain `draft` dan `received`
- tabel atau kolom untuk shift detail
- tabel atau kolom cash movement kompleks
- tabel atau kolom audit log kompleks
- tabel atau kolom app settings yang belum dipakai

Catatan:
Jika revisi migration lama berisiko merusak urutan migration, buat migration baru untuk merapikan schema. Jangan mengedit schema secara acak tanpa strategi.

## Tahapan Implementasi Yang Disarankan

### Tahap 0: Freeze Scope
Tujuan: memastikan semua implementor memakai scope yang sama.

#### Task
- tulis ulang scope final di dokumen ini
- tandai fitur yang dipertahankan
- tandai fitur yang dihapus
- tandai aturan bisnis final
- larang penambahan fitur di luar dokumen

#### Output
- satu dokumen planning final
- satu daftar fitur yang boleh dikerjakan
- satu daftar fitur yang tidak boleh dikerjakan

### Tahap 1: Audit Codebase Saat Ini
Tujuan: menemukan semua bagian kode yang masih memakai fitur no. 2.

#### Task
- audit menu sidebar dan navbar
- audit halaman admin
- audit halaman kasir
- audit route API
- audit type pada folder `types`
- audit migration dan seed
- audit query dashboard
- audit komponen yang masih memakai status lama seperti `draft`, `void`, `refund`, `ordered`, `cancelled`

#### Output
- daftar file yang harus dipertahankan
- daftar file yang harus disederhanakan
- daftar file yang harus dihapus

#### Catatan Untuk Junior / AI Murah
Jangan langsung edit semua file. Buat dulu daftar file dan alasan perubahan. Tujuannya agar tidak ada file penting yang tertinggal.

### Tahap 2: Finalisasi Schema Database
Tujuan: memastikan database hanya mendukung scope MVP.

#### Task
- tetapkan hanya role `admin` dan `kasir`
- tetapkan sales hanya `completed`
- tetapkan purchase hanya `draft` dan `received`
- hapus migration transfer stok
- hapus migration stock opname
- hapus migration retur
- hapus kolom retur pada `sale_items` dan `purchase_items` jika masih ada
- revisi seed data agar tidak menanamkan fitur di luar scope
- pastikan satu store aktif cukup untuk menjalankan sistem

#### Acceptance Criteria
- tidak ada migration aktif untuk transfer, opname, dan retur
- type database konsisten dengan flow MVP
- seed data tidak lagi membuat data untuk fitur yang sudah dihapus

### Tahap 3: Rapikan Auth dan Hak Akses
Tujuan: akses sistem hanya mengikuti role dan scope baru.

#### Task
- pertahankan login manual
- pertahankan logout
- hapus penggunaan role `owner`
- rapikan helper permission agar hanya mengenal `admin` dan `kasir`
- proteksi dashboard admin hanya untuk admin
- proteksi dashboard kasir hanya untuk kasir atau admin yang diizinkan
- hapus dependensi auth yang hanya relevan untuk multi-store granular

#### Acceptance Criteria
- login bekerja
- logout bekerja
- hanya ada role `admin` dan `kasir`
- tidak ada pengecekan role `owner` pada jalur aktif

### Tahap 4: Rapikan Navigasi dan Hapus Menu Fitur No. 2
Tujuan: UI tidak lagi menampilkan fitur yang sudah diputuskan dihapus.

#### Task
- hapus menu transfer stok
- hapus menu stock opname
- hapus menu refund / retur jika ada
- hapus menu settings yang kompleks
- hapus menu audit log penuh
- hapus menu cash movement detail
- hapus menu shift detail jika masih ada
- hapus link dashboard yang mengarah ke fitur tersebut

#### Acceptance Criteria
- sidebar dan dashboard hanya menampilkan fitur MVP
- tidak ada link rusak ke halaman fitur yang sudah dihapus

### Tahap 5: Rapikan Master Data Yang Dipertahankan
Tujuan: semua master data inti siap dipakai transaksi.

#### Modul
- produk
- kategori
- satuan
- customer
- supplier

#### Task
- pastikan CRUD tiap modul berjalan
- rapikan validasi form
- rapikan grid/list jika ada
- rapikan type untuk setiap entitas
- pastikan endpoint hanya mengembalikan field yang relevan

#### Acceptance Criteria
- admin bisa tambah, lihat, edit, dan nonaktifkan data inti
- semua master data dipakai oleh form transaksi

### Tahap 6: Sederhanakan Penjualan Kasir
Tujuan: penjualan hanya memakai flow inti yang mudah dijelaskan di tugas kuliah.

#### Aturan Bisnis
- sales hanya `completed`
- tidak ada draft penjualan panjang
- tidak ada refund kompleks
- tidak ada retur jual
- stok langsung berkurang saat transaksi selesai

#### Task
- hapus tombol atau flow `save draft` jika masih ada
- hapus aksi `void` dan `refund`
- hapus route yang hanya dipakai untuk draft sales
- hapus route retur penjualan
- pastikan form transaksi hanya membuat transaksi selesai
- pastikan stok berkurang setelah transaksi dibuat
- rapikan halaman detail penjualan menjadi read-only bila perlu

#### Acceptance Criteria
- kasir bisa membuat transaksi selesai
- stok berkurang otomatis
- histori penjualan tampil tanpa status rumit

### Tahap 7: Sederhanakan Pembelian
Tujuan: pembelian cukup mendukung restock barang.

#### Aturan Bisnis
- purchase hanya `draft -> received`
- tidak ada `ordered`
- tidak ada `cancelled` bila tidak benar-benar dibutuhkan
- tidak ada partial receive
- tidak ada retur pembelian

#### Task
- rapikan daftar pembelian agar hanya menampilkan status yang dipakai
- hapus aksi `ordered`
- hapus aksi retur pembelian
- hapus route retur pembelian
- pastikan item purchase hanya bisa diubah saat `draft`
- saat status `received`, stok bertambah otomatis satu kali

#### Acceptance Criteria
- draft purchase bisa dibuat
- draft purchase bisa diubah menjadi `received`
- stok tidak bertambah dua kali untuk transaksi yang sama

### Tahap 8: Rapikan Inventori
Tujuan: inventori hanya fokus pada stok saat ini dan mutasi minimum.

#### Task
- tampilkan stok produk
- tampilkan low stock
- tampilkan mutasi stok sederhana
- hapus tab transfer stok
- hapus tab stock opname
- hapus data mutasi yang berasal dari fitur retur jika fitur tersebut dihapus

#### Acceptance Criteria
- halaman inventori hanya menampilkan fitur yang dipakai MVP
- tidak ada tab kosong atau tab rusak

### Tahap 9: Rapikan Dashboard
Tujuan: dashboard hanya menampilkan ringkasan yang benar-benar penting.

#### Dashboard Admin
- total produk
- total customer
- total supplier
- total transaksi penjualan
- low stock
- shortcut ke modul inti

#### Dashboard Kasir
- transaksi hari ini
- omzet hari ini
- shortcut ke transaksi baru

#### Task
- hapus widget shift detail
- hapus widget cash movement
- hapus widget audit log
- hapus widget settings
- hapus perhitungan void/refund
- rapikan query agar hanya mengambil data fitur MVP

#### Acceptance Criteria
- dashboard cepat dimuat
- dashboard tidak lagi bergantung pada fitur yang sudah dihapus

### Tahap 10: Rapikan Laporan
Tujuan: laporan cukup untuk kebutuhan tugas kuliah.

#### Aturan Bisnis
- laporan hanya penjualan dan stok
- filter cukup tanggal
- export cukup CSV
- tidak ada PDF
- tidak ada laporan laba kotor detail
- tidak ada laporan kas kompleks

#### Task
- hapus tab laporan pembelian jika tidak dipakai
- hapus tab laporan profit
- hapus tab laporan cash
- pertahankan laporan penjualan
- pertahankan laporan stok
- pertahankan export CSV
- rapikan teks UI agar sesuai scope baru

#### Acceptance Criteria
- admin bisa melihat laporan penjualan
- admin bisa melihat laporan stok
- admin bisa export CSV

### Tahap 11: Bersihkan Type dan Helper
Tujuan: codebase rapi dan tidak menyimpan sisa fitur lama.

#### Task
- hapus enum status yang tidak dipakai
- hapus type transfer stok
- hapus type stock opname
- hapus type retur bila ada
- rapikan type `SaleStatus`
- rapikan type `PurchaseStatus`
- rapikan helper permission
- rapikan helper dashboard / report bila ada

#### Acceptance Criteria
- tidak ada type yang memaksa komponen memakai fitur lama
- type, schema, dan route konsisten

### Tahap 12: Pengujian dan Validasi Akhir
Tujuan: memastikan seluruh penyederhanaan benar-benar aman.

#### Uji Minimal
- login admin berhasil
- login kasir berhasil
- logout berhasil
- CRUD produk berhasil
- CRUD kategori berhasil
- CRUD satuan berhasil
- CRUD customer berhasil
- CRUD supplier berhasil
- transaksi penjualan berhasil
- stok berkurang setelah penjualan
- purchase draft berhasil dibuat
- purchase received berhasil menambah stok
- dashboard admin tampil
- dashboard kasir tampil
- laporan penjualan tampil
- laporan stok tampil
- export CSV berjalan
- tidak ada menu yang mengarah ke fitur no. 2
- tidak ada migration aktif untuk transfer, opname, dan retur

## Pembagian Issue Kecil Yang Direkomendasikan
Issue harus kecil dan tidak kabur. Satu issue idealnya hanya mengubah satu area.

1. Audit fitur dan file yang terkena simplifikasi scope
2. Hapus menu UI untuk fitur no. 2
3. Hapus route halaman yang hanya dipakai fitur no. 2
4. Hapus migration transfer stok
5. Hapus migration stock opname
6. Hapus migration retur
7. Rapikan enum role menjadi admin dan kasir saja
8. Rapikan helper permission dan store access
9. Rapikan form login dan logout
10. Rapikan dashboard admin agar hanya pakai data MVP
11. Rapikan dashboard kasir agar tidak pakai shift/cash movement
12. Rapikan form transaksi kasir menjadi completed-only
13. Hapus flow draft/void/refund pada penjualan
14. Rapikan histori dan detail penjualan
15. Rapikan modul pembelian menjadi draft-received only
16. Hapus flow ordered/cancelled/return pembelian
17. Rapikan inventori agar tanpa transfer/opname
18. Rapikan laporan menjadi sales + stocks + CSV only
19. Rapikan type entity dan enum agar sinkron dengan schema baru
20. Rapikan seed data agar hanya menghasilkan data MVP
21. Jalankan pengujian manual seluruh flow inti
22. Perbaiki bug sisa hasil cleanup scope

## Format Task Untuk Junior Programmer / AI Murah
Setiap task harus memakai format ini:
- tujuan perubahan
- file yang akan diubah
- file yang akan dihapus
- migration yang terkena dampak
- endpoint yang dibuat/diubah/dihapus
- aturan bisnis yang berlaku
- langkah uji manual
- batasan: jangan mengerjakan fitur di luar task

## Contoh Task Yang Baik
- hapus menu transfer stok dan route terkait
- sederhanakan status purchase menjadi draft dan received
- hapus tombol draft pada form transaksi kasir
- rapikan dashboard kasir agar tidak memakai shift

## Contoh Task Yang Buruk
- rapikan seluruh sistem POS
- hapus semua yang tidak perlu
- perbaiki semua dashboard dan semua API sekaligus

## Aturan Penting Untuk Implementor
- jangan menambah fitur baru
- jangan memindahkan scope kembali ke multi-store penuh
- jangan mempertahankan kode lama hanya karena takut menghapus
- jika fitur benar-benar dihapus, hapus sampai level UI, API, type, dan migration
- jika migration inti masih terlalu lebar, buat rencana revisi yang aman
- selalu cek apakah perubahan di UI sudah sinkron dengan query database
- utamakan kestabilan flow inti daripada kelengkapan fitur

## Definition of Done
Satu issue dianggap selesai jika:
- scope task jelas
- perubahan hanya menyentuh area yang ditentukan
- fitur no. 1 tetap berjalan
- aturan bisnis no. 3 sudah diterapkan pada area tersebut
- sisa fitur no. 2 pada area tersebut sudah dihapus
- ada langkah uji manual
- tidak menambah kompleksitas baru

## Penutup
Target implementasi ini bukan membuat sistem retail besar, tetapi membuat POS UMKM yang stabil, mudah dijelaskan di laporan Waterfall, dan cukup kuat untuk demo.

Fokus implementasi adalah:
- mempertahankan fitur inti
- menyederhanakan alur bisnis
- menghapus fitur dan migrasi yang membuat sistem terlalu kompleks

Jika seluruh dokumen ini diikuti, hasil akhirnya akan lebih realistis untuk tugas kuliah, lebih mudah diuji, dan lebih aman dikerjakan oleh junior programmer atau model AI yang lebih murah.
