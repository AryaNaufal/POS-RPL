# Analisis Kebutuhan POS UMKM

Dokumen ini menjadi output tahap **Analisis Kebutuhan** untuk scope POS inti.

## Daftar Aktor Sistem
- `admin`
- `kasir`

## Daftar Kebutuhan Fungsional
- autentikasi `login` dan `logout`
- pengelolaan master data:
  - produk
  - kategori produk
  - satuan produk
  - customer
  - supplier
- transaksi penjualan:
  - pilih produk dan qty
  - simpan transaksi + item transaksi
  - validasi stok
  - pengurangan stok otomatis
- transaksi pembelian:
  - pilih supplier dan produk
  - simpan transaksi + item transaksi
  - penambahan stok otomatis saat barang diterima
- modul inventori:
  - lihat stok per produk
  - tandai low stock
- dashboard:
  - dashboard admin ringkas
  - dashboard kasir harian
- laporan:
  - laporan penjualan
  - laporan stok

## Daftar Kebutuhan Non-Fungsional
- aplikasi web berbasis Next.js + Supabase
- respons UI tetap baik pada desktop dan tablet
- endpoint backend dibatasi berdasarkan session user
- validasi payload dasar pada endpoint transaksi
- audit trail tersedia untuk aksi penting
- struktur komponen admin seragam (grid/list, toolbar, modal, status)

## Use Case Utama
- `admin` login lalu mengelola master data
- `admin` membuat/mengelola pembelian untuk restok
- `kasir` membuat transaksi penjualan
- sistem memperbarui stok otomatis setelah penjualan/pembelian
- `admin` memantau dashboard dan laporan penjualan/stok

## Batasan Sistem
- scope difokuskan ke POS inti UMKM
- fitur advanced tetap ada di codebase, tetapi tidak wajib untuk penilaian POS inti
- laporan difokuskan ke ringkasan operasional, bukan BI lanjutan

