# Issue: Perencanaan Implementasi Export PDF Bertabel pada Dashboard Admin Reports

## Latar Belakang

Sistem ini akan dikembangkan menjadi aplikasi Point of Sales (POS) untuk toko. Pada modul laporan admin, user saat ini baru bisa melakukan export ke CSV. Untuk kebutuhan dokumentasi, cetak, dan lampiran laporan, perlu ditambahkan fitur export ke PDF yang memiliki tabel rapi dan mudah dibaca.

Target fitur ada pada halaman:

- [`src/app/dashboard/admin/reports/page.tsx`](/c:/code/pos-rpl/src/app/dashboard/admin/reports/page.tsx)
- [`src/components/admin/report-management.tsx`](/c:/code/pos-rpl/src/components/admin/report-management.tsx)

## Kondisi Saat Ini

Modul laporan admin saat ini memiliki:

- tab `sales`
- tab `stocks`
- filter tanggal untuk laporan `sales`
- tombol `Export CSV`

Data laporan saat ini berasal dari:

- `/api/admin/reports/sales`
- `/api/admin/reports/stocks`

Struktur data yang dipakai:

- [`src/types/views/report.ts`](/c:/code/pos-rpl/src/types/views/report.ts)

Belum ada:

- tombol `Export PDF`
- dependency PDF generator
- formatter khusus untuk tabel PDF
- template PDF untuk laporan penjualan dan stok

## Tujuan Fitur

Menambahkan fitur export PDF yang:

- bisa dipakai langsung dari halaman `dashboard/admin/reports`
- menghasilkan file PDF dengan tabel, bukan hanya teks biasa
- mendukung tab laporan `sales` dan `stocks`
- memakai judul, periode, dan isi tabel yang jelas
- cukup sederhana untuk dipelihara oleh junior programmer

## Hasil Akhir yang Diharapkan

User admin dapat:

1. membuka halaman laporan
2. memilih tab `sales` atau `stocks`
3. mengatur filter tanggal jika berada di tab `sales`
4. menekan tombol `Export PDF`
5. mendapatkan file PDF dengan:
   - judul laporan
   - tanggal/periode laporan
   - tabel isi laporan
   - ringkasan sederhana jika diperlukan

## Keputusan Teknis yang Direkomendasikan

Supaya implementasi tetap sederhana, gunakan pendekatan client-side PDF generation.

### Rekomendasi library

Gunakan:

- `jspdf`
- `jspdf-autotable`

Alasan:

- paling umum untuk PDF tabel sederhana
- cocok untuk junior programmer
- cukup stabil untuk export dari data tabel yang sudah ada
- lebih praktis daripada membangun PDF manual dari nol

## Catatan Penting

Jangan membuat export PDF dengan cara screenshot halaman. Hasilnya sulit dirawat dan kualitas tabel biasanya buruk.

Jangan juga mengubah API laporan jika tidak benar-benar perlu. Data yang ada saat ini sudah cukup untuk membuat PDF dasar.

## Scope Fitur

Fitur ini hanya mencakup:

- export PDF untuk tab `sales`
- export PDF untuk tab `stocks`
- tabel PDF yang rapi
- nama file PDF yang jelas

Tidak wajib pada issue ini:

- preview PDF di browser sebelum download
- header PDF dengan logo toko dinamis
- multi-page layout yang sangat kompleks
- styling PDF yang terlalu dekoratif
- export PDF untuk tab laporan lain yang sudah tidak dipakai

## Struktur Implementasi yang Disarankan

Supaya mudah dikerjakan, pecah implementasi menjadi bagian berikut:

### 1. Utility generator PDF laporan

Contoh file:

- `src/lib/reports/export-report-pdf.ts`

Tanggung jawab:

- menerima tipe laporan
- menerima data laporan
- menerima metadata seperti tanggal dan judul
- membangun dokumen PDF
- memanggil `autoTable`
- menyimpan/download file PDF

### 2. Mapping data tabel untuk setiap tab

Contoh helper:

- `buildSalesPdfRows()`
- `buildStocksPdfRows()`

Tanggung jawab:

- mengubah data mentah menjadi array row yang siap dipakai `jspdf-autotable`

### 3. Integrasi UI tombol Export PDF

File utama:

- [`src/components/admin/report-management.tsx`](/c:/code/pos-rpl/src/components/admin/report-management.tsx)

Tanggung jawab:

- menambahkan tombol `Export PDF`
- memanggil utility PDF
- disable tombol jika data kosong
- menampilkan error jika export gagal

## File yang Kemungkinan Diubah

Paling mungkin disentuh:

- [`src/components/admin/report-management.tsx`](/c:/code/pos-rpl/src/components/admin/report-management.tsx)
- [`src/types/views/report.ts`](/c:/code/pos-rpl/src/types/views/report.ts) jika butuh type tambahan
- `src/lib/reports/export-report-pdf.ts`
- `package.json`
- `package-lock.json`

Jika ingin lebih rapi, boleh juga membuat:

- `src/lib/reports/report-pdf-formatters.ts`

## Tahapan Implementasi

### 1. Audit modul report yang sudah ada

Baca file berikut:

- [`src/components/admin/report-management.tsx`](/c:/code/pos-rpl/src/components/admin/report-management.tsx)
- [`src/types/views/report.ts`](/c:/code/pos-rpl/src/types/views/report.ts)

Tujuan audit:

- mengetahui tab aktif yang tersedia
- mengetahui struktur data `sales` dan `stocks`
- mengetahui logic `Export CSV` yang sudah ada

Output:

- implementor paham titik integrasi tombol `Export PDF`

### 2. Pilih library PDF dan pasang dependency

Pasang dependency:

- `jspdf`
- `jspdf-autotable`

Catatan:

- gunakan satu pendekatan saja
- jangan campur banyak library PDF

Output:

- proyek punya dependency resmi untuk export PDF

### 3. Buat utility export PDF terpisah

Buat utility khusus agar logic PDF tidak ditaruh langsung di komponen React.

Contoh fungsi:

- `exportReportPdf({ type, data, dateFrom, dateTo })`

Isi fungsi minimal:

- buat instance `jsPDF`
- buat judul laporan
- tampilkan metadata periode
- generate tabel memakai `autoTable`
- simpan file PDF

Output:

- logic export terisolasi dan reusable

### 4. Tentukan format PDF untuk tab sales

Untuk tab `sales`, tabel PDF minimal memiliki kolom:

- tanggal
- qty nota
- qty produk
- total omzet

Di atas tabel, tampilkan:

- judul: `Laporan Penjualan`
- periode: `dateFrom - dateTo`

Opsional tetapi direkomendasikan:

- ringkasan total penjualan
- total transaksi
- total item terjual

Output:

- format PDF sales jelas dan stabil

### 5. Tentukan format PDF untuk tab stocks

Untuk tab `stocks`, tabel PDF minimal memiliki kolom:

- nama produk
- SKU
- store
- qty stok
- nilai aset

Di atas tabel, tampilkan:

- judul: `Laporan Stok`
- tanggal export

Catatan:

- tab stok saat ini tidak memakai filter tanggal, jadi cukup tampilkan tanggal export atau label `snapshot`

Output:

- format PDF stocks jelas dan mudah dipahami

### 6. Buat mapper data ke row PDF

Jangan langsung kirim object mentah dari API ke `autoTable`.

Buat mapper yang mengubah data ke bentuk sederhana:

- array header
- array body row

Contoh untuk `sales`:

- `["Tanggal", "Qty Nota", "Qty Produk", "Total Omzet"]`

Contoh untuk `stocks`:

- `["Produk", "SKU", "Store", "Stok", "Nilai Aset"]`

Output:

- struktur data PDF lebih aman dan mudah diuji

### 7. Integrasikan tombol Export PDF ke UI laporan

Di `report-management.tsx`, tambahkan tombol baru:

- `Export PDF`

Aturan UI:

- tampil di dekat tombol `Export CSV`
- disable jika `data.length === 0`
- gunakan style yang konsisten dengan tombol lain

Output:

- user punya aksi export PDF yang jelas

### 8. Tambahkan penanganan error saat export

Jika generator PDF gagal:

- tampilkan pesan error sederhana
- jangan membuat halaman crash

Contoh pesan:

- `Gagal membuat file PDF`

Output:

- fitur export lebih aman dipakai

### 9. Tentukan nama file PDF

Gunakan nama file yang jelas dan konsisten.

Contoh:

- `report-sales-2026-04-01-to-2026-04-18.pdf`
- `report-stocks-2026-04-18.pdf`

Output:

- file hasil export mudah diidentifikasi user

### 10. Rapikan tampilan tabel PDF

Minimal atur:

- ukuran font
- padding sel
- warna header tabel
- alignment kolom angka ke kanan
- pemotongan teks panjang bila perlu

Jangan terlalu banyak styling. Fokus utama:

- terbaca
- rapi
- konsisten

Output:

- PDF terlihat profesional walau sederhana

### 11. Uji manual untuk dua tab laporan

Skenario minimal:

1. Buka tab `sales`
2. Atur filter tanggal
3. Klik `Export PDF`
4. Pastikan file terunduh
5. Buka PDF dan cek tabel penjualan
6. Pindah ke tab `stocks`
7. Klik `Export PDF`
8. Pastikan file terunduh
9. Buka PDF dan cek tabel stok
10. Coba export saat data kosong

Output:

- fitur terbukti berjalan pada semua tab aktif

## Acceptance Criteria

Fitur dianggap selesai jika:

1. Halaman `dashboard/admin/reports` memiliki tombol `Export PDF`.
2. Tombol `Export PDF` bekerja untuk tab `sales`.
3. Tombol `Export PDF` bekerja untuk tab `stocks`.
4. File PDF berisi tabel, bukan hanya teks polos.
5. PDF menampilkan judul laporan yang sesuai.
6. PDF `sales` menampilkan periode filter tanggal.
7. PDF `stocks` menampilkan data stok yang relevan.
8. Tombol disable saat tidak ada data.
9. Export PDF tidak merusak fitur `Export CSV` yang sudah ada.

## Checklist Implementasi

- [ ] Audit modul report selesai
- [ ] Dependency `jspdf` dipasang
- [ ] Dependency `jspdf-autotable` dipasang
- [ ] Utility export PDF dibuat
- [ ] Formatter data `sales` dibuat
- [ ] Formatter data `stocks` dibuat
- [ ] Tombol `Export PDF` ditambahkan
- [ ] Error handling export ditambahkan
- [ ] Nama file PDF dibuat konsisten
- [ ] Testing manual tab `sales` selesai
- [ ] Testing manual tab `stocks` selesai

## Pembagian Task Kecil yang Direkomendasikan

Agar aman untuk junior programmer atau model AI murah, pecah issue menjadi task kecil:

1. Audit report-management dan struktur data report
2. Pasang dependency PDF
3. Buat utility export PDF dasar
4. Implementasikan PDF untuk tab `sales`
5. Implementasikan PDF untuk tab `stocks`
6. Tambahkan tombol `Export PDF` ke UI
7. Uji manual hasil PDF

## Instruksi Singkat untuk Junior Programmer / AI Murah

Kerjakan berurutan seperti ini:

1. Baca `src/components/admin/report-management.tsx`
2. Baca `src/types/views/report.ts`
3. Pasang `jspdf` dan `jspdf-autotable`
4. Buat helper export PDF terpisah
5. Buat format tabel PDF untuk `sales`
6. Buat format tabel PDF untuk `stocks`
7. Tambahkan tombol `Export PDF`
8. Tes hasil file PDF untuk kedua tab

## Hal yang Tidak Boleh Dilakukan

- jangan mengganti API laporan tanpa alasan kuat
- jangan membuat PDF dengan screenshot halaman
- jangan menaruh semua logic PDF langsung di komponen React
- jangan merusak `Export CSV` yang sudah ada
- jangan menambah scope ke preview PDF atau desain report kompleks jika belum diminta

## Ringkasan

Issue ini fokus pada penambahan export PDF bertabel untuk modul laporan admin. Implementasi terbaik untuk repo ini adalah menambahkan generator PDF client-side yang sederhana, memanfaatkan data report yang sudah ada, dan mengintegrasikannya ke `report-management` tanpa mengubah flow laporan yang sekarang.
