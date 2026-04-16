# Skenario Uji Manual End-to-End POS Minimarket

## 1. Persiapan Data Master
- [ ] Buka menu **Master Supplier**, tambahkan 1 supplier baru.
- [ ] Buka menu **Kategori Produk**, pastikan ada minimal 2 kategori.
- [ ] Buka menu **Master Produk**, tambahkan 2 produk baru dengan gambar placeholder. Set stok minimum ke 5.

## 2. Alur Pembelian (Restok)
- [ ] Buka menu **Pembelian**, buat draft baru untuk Store A dengan Supplier yang baru dibuat.
- [ ] Klik draft tersebut, tambahkan 2 produk baru tadi dengan qty masing-masing 10.
- [ ] Klik **Pesan (Ordered)**.
- [ ] Klik **Terima Barang (Received)**.
- [ ] Buka menu **Stok & Inventori**, pastikan stok produk tersebut bertambah menjadi 10 di Store A.

## 3. Operasional Kasir
- [ ] Buka menu **Shift Kasir** (Admin) atau langsung ke dashboard **Kasir**.
- [ ] Di halaman Kasir, klik **Buka Shift Sekarang** dengan modal awal Rp 100.000.
- [ ] Klik **Tambah Transaksi**.
- [ ] Tambahkan beberapa item, pilih metode bayar **Cash**, lalu klik **Bayar Sekarang**.
- [ ] Pastikan transaksi muncul di tabel "Transaksi Kasir Terbaru".
- [ ] Buat 1 transaksi lagi, tapi kali ini klik **Simpan Draft**.
- [ ] Kembali ke dashboard kasir, pastikan statistik "Total Penjualan" dan "Transaksi Selesai" ter-update.

## 4. Manajemen Penjualan & Retur
- [ ] Buka menu **Penjualan** di Admin.
- [ ] Klik transaksi yang baru saja diselesaikan.
- [ ] Coba lakukan **Retur** pada salah satu item. Masukkan qty 1.
- [ ] Cek menu **Stok & Inventori**, pastikan stok kembali bertambah 1 karena retur.
- [ ] Coba lakukan **Void** pada transaksi draft yang tadi dibuat di kasir.

## 5. Mutasi Stok Lanjutan
- [ ] Buka menu **Stok & Inventori** -> tab **Transfer Stok**.
- [ ] Buat transfer dari Store A ke Store B untuk 1 produk dengan qty 2.
- [ ] Klik **Kirim**.
- [ ] Klik **Terima** (seolah-olah user Store B yang terima).
- [ ] Pastikan stok di Store A berkurang 2 dan Store B bertambah 2.
- [ ] Buka tab **Stock Opname**, klik **Mulai Opname Baru**.
- [ ] Ubah qty fisik salah satu produk (misal dari 8 menjadi 7).
- [ ] Klik **Simpan Sesi**, lalu klik **Finalisasi**.
- [ ] Pastikan stok produk tersebut sekarang menjadi 7.

## 6. Biaya & Kas
- [ ] Di dashboard Kasir, lakukan **Kas Keluar** Rp 10.000 untuk "Beli Sabun Cuci".
- [ ] Buka menu **Biaya Operasional** di Admin, tambahkan biaya "Listrik" Rp 50.000.
- [ ] Kembali ke dashboard Kasir, klik **Tutup Shift**. Masukkan uang di laci yang sesuai (Modal + Penjualan - Kas Keluar).
- [ ] Pastikan selisih kas tercatat 0 (atau sesuai input).

## 7. Laporan & Audit
- [ ] Buka menu **Audit Log**, pastikan semua aksi di atas (create, update, status change) tercatat.
- [ ] Buka menu **Laporan**.
- [ ] Cek tab **Sales**, **Purchases**, **Laba Kotor**, **Stocks**, dan **Cash**.
- [ ] Pastikan angka-angkanya masuk akal sesuai aktivitas tadi.
- [ ] Klik **Cetak PDF** dan **Export CSV** untuk mencoba fungsinya.

## 8. Pembersihan (Opsional)
- [ ] Buka **Pengaturan**, ubah Nama Toko dan Prefix Invoice.
- [ ] Pastikan dashboard admin menampilkan data ringkasan terbaru.
