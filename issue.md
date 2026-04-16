# Planning Implementasi Sistem Informasi Point of Sale (POS) UMKM

## Judul Proyek
Perancangan Sistem Informasi Point of Sale (POS) pada Toko UMKM untuk Meningkatkan Efektivitas Pengelolaan Transaksi Menggunakan Model SDLC Waterfall

## Tujuan
Membangun aplikasi POS sederhana namun cukup lengkap untuk kebutuhan toko UMKM, dengan fokus pada:
- pencatatan transaksi penjualan
- pencatatan pembelian barang
- pengelolaan data produk
- pengelolaan stok
- laporan dasar penjualan dan stok

Dokumen ini disusun agar implementasi bisa dikerjakan oleh junior programmer atau model AI yang lebih murah. Karena itu, scope harus realistis, tahapan harus jelas, dan setiap task harus kecil.

## Batasan Scope Yang Disarankan
Agar sesuai untuk tugas kuliah, aplikasi tidak perlu menjadi sistem retail yang terlalu besar.

### Fitur Yang Dipertahankan
- [x] login
- [x] logout
- [x] dashboard sederhana
- [x] role dasar: `admin` dan `kasir`
- [x] master produk
- [x] kategori produk
- [x] satuan produk
- [x] master customer
- [x] master supplier
- [x] transaksi penjualan
- [x] transaksi pembelian sederhana
- [x] update stok otomatis dari penjualan dan pembelian
- [x] laporan penjualan
- [x] laporan stok

### Fitur Yang Sebaiknya Ditunda
- [x] multi-store penuh
- [x] role per store yang kompleks
- [x] transfer stok antar toko
- [x] retur jual / retur beli
- [x] stock opname massal
- [x] audit log kompleks
- [x] app settings lengkap
- [x] cash movement detail
- [x] shift kasir dengan perhitungan kas rinci
- [x] refund kompleks
- [x] draft lifecycle transaksi yang panjang
- [x] export PDF

## Alasan Scope Disederhanakan
- judul tugas kuliah fokus pada efektivitas pengelolaan transaksi UMKM
- Waterfall lebih cocok jika kebutuhan stabil dan tidak terlalu luas
- implementasi akan lebih mudah diuji dan dijelaskan di laporan
- risiko bug berkurang jika fokus pada fitur inti POS

## Hasil Akhir Yang Diharapkan
Saat aplikasi selesai, user dapat:
- login ke sistem
- mengelola data produk, kategori, satuan, customer, dan supplier
- melakukan transaksi penjualan
- melakukan transaksi pembelian
- melihat perubahan stok otomatis
- melihat laporan penjualan dan stok

## Pendekatan SDLC Waterfall
Implementasi sebaiknya mengikuti urutan Waterfall agar sesuai dengan judul.

### 1. Analisis Kebutuhan
Tujuan: menentukan kebutuhan sistem secara jelas sebelum coding.

#### Output
- [x] daftar aktor sistem
- [x] daftar kebutuhan fungsional
- [x] daftar kebutuhan non-fungsional
- [x] use case utama
- [x] batasan sistem

#### Aktor
- [x] admin
- [x] kasir

#### Kebutuhan Fungsional Minimum
- [x] login
- [x] kelola produk
- [x] kelola kategori produk
- [x] kelola satuan produk
- [x] kelola customer
- [x] kelola supplier
- [x] input transaksi penjualan
- [x] input transaksi pembelian
- [x] update stok otomatis
- [x] lihat laporan penjualan
- [x] lihat laporan stok

### 2. Perancangan Sistem
Tujuan: menyusun desain sebelum implementasi.

#### Output
- [x] ERD
- [x] struktur tabel
- [x] flow transaksi penjualan
- [x] flow transaksi pembelian
- [x] rancangan UI per halaman
- [x] struktur folder proyek
- [x] daftar endpoint API

#### Catatan
- gunakan tabel yang sudah ada, tetapi batasi pemakaian hanya pada fitur inti
- jika ada tabel yang belum dipakai untuk scope kuliah, jangan diprioritaskan

### 3. Implementasi
Tujuan: membangun sistem sesuai desain yang sudah disetujui.

### 4. Pengujian
Tujuan: memastikan semua fitur utama berjalan sesuai kebutuhan.

### 5. Pemeliharaan
Tujuan: menyiapkan catatan pengembangan lanjutan, walaupun untuk tugas kuliah biasanya cukup berupa rekomendasi.

## Urutan Implementasi Teknis
Urutan ini penting agar implementor tidak bingung.

1. fondasi autentikasi
2. master data
3. penjualan
4. pembelian
5. stok
6. dashboard
7. laporan
8. pengujian

## Tahapan Implementasi Detail

### Tahap 1: Fondasi Autentikasi dan Role Dasar
Tujuan: membuat akses login yang cukup untuk membedakan admin dan kasir.

#### Task
- [x] rapikan login dan logout
- [x] batasi role hanya `admin` dan `kasir`
- [x] buat proteksi route dashboard admin dan kasir
- [x] pastikan session valid saat akses halaman penting

#### Acceptance Criteria
- admin dan kasir bisa login
- user tanpa session tidak bisa masuk dashboard

### Tahap 2: Master Data Produk
Tujuan: membangun seluruh data dasar yang dibutuhkan transaksi.

#### Modul
- [x] master produk
- [x] kategori produk
- [x] satuan produk

#### Task
- [x] CRUD produk
- [x] CRUD kategori produk
- [x] CRUD satuan produk
- [x] pencarian data
- [x] aktif/nonaktif data bila perlu

#### Acceptance Criteria
- produk bisa ditambah, diubah, dilihat, dan dinonaktifkan
- kategori dan satuan bisa dipakai di form produk

### Tahap 3: Master Data Customer dan Supplier
Tujuan: melengkapi data pihak yang terlibat dalam transaksi.

#### Modul
- [x] master customer
- [x] master supplier

#### Task
- [x] CRUD customer
- [x] CRUD supplier
- [x] pencarian data
- [x] validasi field penting seperti nama, kontak, dan kode jika dipakai

#### Acceptance Criteria
- customer dapat dipilih saat penjualan
- supplier dapat dipilih saat pembelian

### Tahap 4: Modul Penjualan
Tujuan: mencatat transaksi penjualan barang ke customer.

#### Fitur
- [x] form tambah transaksi penjualan
- [x] pilih produk
- [x] input qty
- [x] hitung subtotal dan total
- [x] simpan transaksi
- [x] simpan item transaksi
- [x] kurangi stok otomatis

#### Task
- [x] buat endpoint simpan sales
- [x] buat endpoint simpan sale items
- [x] kurangi `product_stocks`
- [x] validasi stok cukup
- [x] tampilkan daftar transaksi terbaru

#### Acceptance Criteria
- transaksi penjualan tersimpan
- stok berkurang sesuai qty terjual

### Tahap 5: Modul Pembelian
Tujuan: mencatat pembelian barang dari supplier.

#### Fitur
- [x] form pembelian sederhana
- [x] pilih supplier
- [x] pilih produk
- [x] input qty dan harga beli
- [x] simpan transaksi pembelian
- [x] tambah stok otomatis

#### Task
- [x] buat endpoint simpan purchases
- [x] buat endpoint simpan purchase items
- [x] tambah `product_stocks`
- [x] catat pembelian sebagai transaksi selesai sederhana

#### Catatan
- untuk tugas kuliah, status pembelian bisa disederhanakan
- jika perlu, cukup gunakan alur langsung `received`

#### Acceptance Criteria
- transaksi pembelian tersimpan
- stok bertambah sesuai qty dibeli

### Tahap 6: Modul Stok
Tujuan: menampilkan kondisi stok agar admin dapat memantau persediaan.

#### Fitur
- [x] daftar stok produk
- [x] stok minimum
- [x] status stok menipis

#### Task
- [x] tampilkan stok per produk
- [x] tandai produk di bawah minimum stok
- [x] buat tampilan inventori sederhana

#### Acceptance Criteria
- admin dapat melihat stok tersedia
- produk low stock mudah dikenali

### Tahap 7: Dashboard
Tujuan: memberikan ringkasan sistem secara cepat.

#### Dashboard Admin
- [x] jumlah produk
- [x] jumlah customer
- [x] jumlah supplier
- [x] total penjualan
- [x] produk low stock

#### Dashboard Kasir
- [x] transaksi hari ini
- [x] total transaksi hari ini
- [x] shortcut ke transaksi baru

#### Acceptance Criteria
- dashboard menampilkan data nyata dari database
- user bisa memahami kondisi sistem dengan cepat

### Tahap 8: Laporan
Tujuan: menyediakan bukti bahwa sistem membantu efektivitas pengelolaan transaksi.

#### Fitur
- [x] laporan penjualan
- [x] laporan stok

#### Task
- [x] filter tanggal laporan penjualan
- [x] tampilkan total penjualan
- [x] tampilkan produk terjual
- [x] tampilkan stok saat ini

#### Acceptance Criteria
- admin dapat melihat laporan penjualan
- admin dapat melihat laporan stok

## Struktur Task Untuk Junior Programmer / AI Murah
Agar aman, setiap task harus kecil dan punya format tetap.

### Format Task
- tujuan
- file yang akan diubah
- tabel yang dipakai
- endpoint yang dibuat atau diubah
- input dan output
- langkah uji manual

### Contoh Task Yang Baik
- buat CRUD customer
- buat endpoint penjualan
- buat halaman laporan stok

### Contoh Task Yang Terlalu Besar
- buat seluruh sistem POS
- buat semua laporan
- buat semua master data sekaligus

## Daftar Issue Kecil Yang Direkomendasikan
Issue berikut bisa langsung dijadikan unit kerja.

1. Rapikan autentikasi login dan logout
2. Batasi role menjadi admin dan kasir
3. CRUD kategori produk
4. CRUD satuan produk
5. CRUD produk
6. CRUD customer
7. CRUD supplier
8. Form transaksi penjualan
9. Simpan sales dan sale items
10. Kurangi stok otomatis saat penjualan
11. Form transaksi pembelian
12. Simpan purchase dan purchase items
13. Tambah stok otomatis saat pembelian
14. Halaman inventori / stok
15. Dashboard admin
16. Dashboard kasir
17. Laporan penjualan
18. Laporan stok
19. Pengujian end-to-end
20. Rapikan UI dan validasi

## Skenario Uji Manual Minimal
- [x] login sebagai admin berhasil
- [x] login sebagai kasir berhasil
- [x] tambah produk berhasil
- [x] tambah customer berhasil
- [x] tambah supplier berhasil
- [x] transaksi penjualan tersimpan
- [x] stok berkurang setelah penjualan
- [x] transaksi pembelian tersimpan
- [x] stok bertambah setelah pembelian
- [x] dashboard menampilkan data yang benar
- [x] laporan penjualan tampil
- [x] laporan stok tampil

## Definition of Done
Satu issue dianggap selesai jika:
- fitur utama berjalan
- validasi dasar ada
- data tersimpan benar di database
- UI bisa dipakai
- ada langkah uji manual

## Catatan Penting Untuk Implementor
- jangan mulai dari fitur yang terlalu kompleks
- fokus dulu pada transaksi inti UMKM
- jangan membangun multi-store bila tidak dibutuhkan untuk tugas kuliah
- jangan menambahkan fitur canggih yang sulit dijelaskan di laporan
- jika AI murah yang mengerjakan, berikan satu issue kecil per eksekusi

## Rekomendasi Penutup
Untuk konteks tugas kuliah, target terbaik adalah menyelesaikan POS inti yang stabil, bukan membuat sistem retail besar.

Jika semua fitur inti di atas selesai dengan baik, itu sudah cukup kuat untuk mendukung judul penelitian dan menunjukkan penerapan SDLC Waterfall secara jelas.


