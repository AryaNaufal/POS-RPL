# Planning Implementasi Reset Password Pengguna

## Judul Proyek
Perancangan Sistem Informasi Point of Sale (POS) pada Toko UMKM untuk Meningkatkan Efektivitas Pengelolaan Transaksi Menggunakan Model SDLC Waterfall

## Tujuan Dokumen
Dokumen ini menjadi acuan implementasi fitur reset password untuk pengguna pada sistem POS manual login.

Fokusnya adalah:
- tetap memakai skema auth yang sudah ada
- menambah alur reset password yang aman dan sederhana
- membuat tahapan kerja yang jelas untuk junior programmer atau model AI yang lebih murah

## Konteks Sistem Saat Ini
Sistem auth yang dipakai sekarang masih manual, bukan Supabase Auth. Alur yang sudah berjalan:
- registrasi menulis `password_hash` ke tabel `users`
- login membaca `password_hash` dari tabel `users`
- session dibuat dari endpoint login manual

File yang paling relevan:
- [`src/app/api/users/route.ts`](/c:/code/pos-rpl/src/app/api/users/route.ts)
- [`src/app/api/login/route.ts`](/c:/code/pos-rpl/src/app/api/login/route.ts)
- [`src/components/auth/auth-card.tsx`](/c:/code/pos-rpl/src/components/auth/auth-card.tsx)
- [`src/components/auth/auth-form.tsx`](/c:/code/pos-rpl/src/components/auth/auth-form.tsx)
- [`supabase/migrations/0002_create_manual_users_table.sql`](/c:/code/pos-rpl/supabase/migrations/0002_create_manual_users_table.sql)

## Masalah Yang Ingin Diselesaikan
Saat ini pengguna yang lupa password belum punya alur pemulihan akun.

Akibatnya:
- user harus dibantu manual oleh admin atau developer
- proses login bisa terhambat
- pengalaman pengguna kurang baik

## Target Fitur
User dapat:
1. membuka halaman login
2. memilih menu `Lupa Password`
3. memasukkan email akun
4. menerima tautan reset password
5. membuka halaman reset password
6. membuat password baru
7. login kembali dengan password baru

## Hasil Akhir Yang Diharapkan
Setelah fitur selesai:
- pengguna bisa reset password sendiri
- password lama tidak bisa dipakai lagi setelah reset berhasil
- token reset hanya berlaku sekali
- token reset memiliki masa berlaku
- UI reset password sederhana dan mudah dipahami

## Keputusan Teknis Yang Direkomendasikan
Gunakan flow reset password berbasis token.

Alur yang disarankan:
1. user request reset password dengan email
2. sistem membuat token reset yang acak dan sulit ditebak
3. token disimpan di database dengan expiry time
4. sistem mengirim link reset password ke email user
5. user membuka link dan memasukkan password baru
6. sistem memvalidasi token lalu update `password_hash`
7. token ditandai sudah dipakai

## Kenapa Flow Ini Dipilih
- cocok dengan sistem login manual yang sudah ada
- lebih aman daripada reset password langsung tanpa token
- mudah dijelaskan dalam dokumen Waterfall
- bisa dikerjakan bertahap oleh junior programmer

## Scope Fitur
Fitur ini hanya mencakup:
- request reset password
- validasi token reset
- halaman reset password
- update password baru
- invalidasi token lama

Tidak wajib pada issue ini:
- reset password via admin panel
- multi-step recovery yang kompleks
- login via magic link
- 2FA
- histori reset password lengkap

## Struktur Implementasi Yang Disarankan

### 1. Tabel token reset password
Tambahkan tabel baru untuk menyimpan token reset.

Contoh nama tabel:
- `password_reset_tokens`

Kolom yang disarankan:
- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `used_at`
- `created_at`

Catatan:
- simpan hash token, bukan token mentah
- token hanya dipakai sekali
- token harus punya batas waktu

### 2. Endpoint request reset password
Buat endpoint untuk menerima email user dan membuat token reset.

Contoh file:
- `src/app/api/auth/password-reset/request/route.ts`

Tanggung jawab:
- validasi email
- cari user berdasarkan email
- buat token acak
- simpan hash token ke database
- kirim email reset password

### 3. Endpoint verifikasi token
Buat endpoint atau helper untuk mengecek token sebelum user reset password.

Contoh file:
- `src/app/api/auth/password-reset/verify/route.ts`

Tanggung jawab:
- cek token ada atau tidak
- cek token belum dipakai
- cek token belum expired
- kembalikan status token valid / tidak valid

### 4. Endpoint submit password baru
Buat endpoint untuk menyimpan password baru setelah token valid.

Contoh file:
- `src/app/api/auth/password-reset/confirm/route.ts`

Tanggung jawab:
- validasi token
- validasi password baru
- hash password baru
- update kolom `password_hash` di tabel `users`
- tandai token sebagai sudah dipakai

### 5. Halaman request reset password
Buat halaman form untuk user memasukkan email.

Contoh file:
- `src/app/reset-password/page.tsx`

Tanggung jawab:
- form input email
- tombol kirim link reset
- tampilkan pesan sukses atau error
- tidak membuka informasi sensitif tentang apakah email terdaftar atau tidak

### 6. Halaman reset password
Buat halaman untuk password baru setelah user klik link email.

Contoh file:
- `src/app/reset-password/[token]/page.tsx`

Tanggung jawab:
- ambil token dari URL
- validasi token
- tampilkan form password baru dan konfirmasi password
- kirim password baru ke endpoint confirm

### 7. Komponen UI auth
Tambahkan akses ke fitur reset password dari halaman login.

Contoh file:
- [`src/components/auth/auth-card.tsx`](/c:/code/pos-rpl/src/components/auth/auth-card.tsx)
- [`src/components/auth/auth-form.tsx`](/c:/code/pos-rpl/src/components/auth/auth-form.tsx)

Tanggung jawab:
- tampilkan link `Lupa Password`
- arahkan user ke halaman request reset password
- jaga agar flow login tetap sederhana

### 8. Pengiriman email
Buat mekanisme pengiriman email reset password.

Rekomendasi:
- gunakan SMTP atau provider email yang mudah dipakai
- pisahkan logic email ke helper khusus

Contoh file:
- `src/lib/email/send-password-reset.ts`

Tanggung jawab:
- membangun URL reset password
- mengirim email berisi link reset
- menangani error pengiriman

## Tahapan Implementasi

### 1. Audit auth manual yang sudah ada
Tujuan: memahami alur login dan registrasi sebelum menambah reset password.

#### File yang dibaca
- [`src/app/api/login/route.ts`](/c:/code/pos-rpl/src/app/api/login/route.ts)
- [`src/app/api/users/route.ts`](/c:/code/pos-rpl/src/app/api/users/route.ts)
- [`src/components/auth/auth-card.tsx`](/c:/code/pos-rpl/src/components/auth/auth-card.tsx)
- [`src/components/auth/auth-form.tsx`](/c:/code/pos-rpl/src/components/auth/auth-form.tsx)

#### Yang harus dipahami
- password disimpan dalam format hash
- login mencocokkan password terhadap hash
- register membuat hash baru
- session dibuat setelah login berhasil

#### Output
- implementor tahu titik integrasi reset password

### 2. Tentukan flow reset password final
Tujuan: jangan coding sebelum alur final disepakati.

#### Flow yang disarankan
1. user klik `Lupa Password`
2. user isi email
3. sistem kirim tautan reset
4. user buka tautan
5. user isi password baru
6. sistem update password
7. user login kembali

#### Output
- flow final jelas dan tidak berubah-ubah

### 3. Tambahkan migration token reset password
Tujuan: database punya tempat yang aman untuk menyimpan token reset.

#### Task
- buat tabel `password_reset_tokens`
- tambahkan index untuk `user_id` dan `expires_at`
- simpan `token_hash`, bukan token mentah
- sediakan kolom `used_at`

#### Acceptance Criteria
- token reset bisa disimpan
- token reset bisa dicek masa berlakunya
- token reset bisa ditandai sudah dipakai

### 4. Buat endpoint request reset password
Tujuan: user bisa meminta reset password memakai email.

#### Task
- validasi email
- cari user berdasarkan email
- buat token acak yang kuat
- simpan hash token ke database
- kirim email reset password

#### Catatan Penting
- jangan mengembalikan pesan yang membocorkan email terdaftar atau tidak
- response untuk frontend sebaiknya generik

#### Acceptance Criteria
- request reset password berhasil diproses
- token tersimpan
- email reset terkirim

### 5. Buat halaman request reset password
Tujuan: user punya UI untuk meminta reset password.

#### Task
- buat form input email
- buat tombol kirim link reset
- tampilkan feedback sukses / gagal
- tambahkan link kembali ke login

#### Acceptance Criteria
- user dapat request reset password dari UI
- halaman sederhana dan mudah dipahami

### 6. Buat halaman reset password
Tujuan: user bisa mengisi password baru dari link email.

#### Task
- ambil token dari URL
- cek validasi token
- tampilkan form password baru
- tampilkan konfirmasi password
- kirim password baru ke endpoint confirm

#### Acceptance Criteria
- password baru dapat disimpan
- token tidak bisa dipakai dua kali

### 7. Buat endpoint confirm reset password
Tujuan: password lama benar-benar diganti dengan password baru.

#### Task
- validasi token
- cek expired
- cek token belum dipakai
- validasi password baru
- hash password baru
- update `users.password_hash`
- set token sebagai `used`

#### Acceptance Criteria
- password lama tidak berlaku lagi
- login memakai password baru berhasil

### 8. Tambahkan validasi keamanan
Tujuan: fitur reset password tidak mudah disalahgunakan.

#### Task
- token hanya berlaku sekali
- token punya masa berlaku
- password baru minimal panjang aman
- rate limit request reset jika memungkinkan
- jangan bocorkan keberadaan email

#### Acceptance Criteria
- token tidak bisa diulang
- request spam lebih sulit

### 9. Integrasikan ke UI auth
Tujuan: user bisa menemukan fitur reset password dengan mudah.

#### Task
- tambahkan link `Lupa Password`
- arahkan ke halaman request reset password
- pastikan desain selaras dengan halaman login/register

#### Acceptance Criteria
- flow reset password mudah ditemukan dari login

### 10. Uji manual end-to-end
Tujuan: memastikan alur bekerja dari awal sampai akhir.

#### Skenario Uji
1. buka login
2. klik `Lupa Password`
3. isi email
4. pastikan request berhasil
5. buka link reset
6. isi password baru
7. submit password baru
8. login dengan password baru
9. login dengan password lama harus gagal

#### Output
- fitur reset password terbukti berjalan penuh

## Urutan Implementasi Teknis
Urutan ini penting agar implementor tidak bingung:
1. audit auth manual
2. migration token reset
3. endpoint request reset
4. halaman request reset
5. halaman reset password
6. endpoint confirm reset
7. validasi keamanan
8. integrasi UI auth
9. testing manual

## Pembagian Task Untuk Junior Programmer / AI Murah
Setiap task harus kecil dan jelas.

### Format Task Yang Disarankan
- tujuan
- file yang akan diubah
- tabel yang dipakai
- endpoint yang dibuat atau diubah
- input/output
- langkah uji manual

### Contoh Task Yang Baik
- buat tabel token reset password
- buat endpoint request reset password
- buat halaman reset password

### Contoh Task Yang Terlalu Besar
- buat fitur auth lengkap
- buat seluruh keamanan login
- perbaiki semua halaman user

## Daftar Issue Kecil Yang Direkomendasikan
Issue berikut bisa diberikan satu per satu ke implementor:
1. Audit alur auth manual yang sudah ada
2. Buat migration token reset password
3. Buat endpoint request reset password
4. Buat halaman request reset password
5. Buat endpoint verifikasi token
6. Buat halaman reset password
7. Buat endpoint confirm reset password
8. Tambahkan link reset password di halaman login
9. Tambahkan validasi keamanan token
10. Uji manual reset password end-to-end

## Skenario Uji Manual Minimal
- user bisa membuka halaman request reset password
- user bisa mengirim permintaan reset password
- token reset tersimpan di database
- user bisa membuka link reset dari email
- user bisa mengisi password baru
- password lama tidak bisa dipakai lagi
- password baru bisa dipakai untuk login

## Definition of Done
Satu issue dianggap selesai jika:
- fitur utama berjalan
- validasi dasar ada
- data tersimpan benar di database
- UI dapat dipakai
- tidak membuka celah keamanan yang jelas
- ada langkah uji manual

## Catatan Penting Untuk Implementor
- jangan mengubah mekanisme login manual yang sudah ada tanpa alasan kuat
- jangan simpan token reset dalam bentuk mentah
- jangan bocorkan apakah email terdaftar atau tidak
- jangan membiarkan token berlaku terlalu lama
- jangan lupa invalidate token setelah dipakai

## Penutup
Target terbaik untuk fitur ini adalah reset password yang sederhana, aman, dan cocok dengan sistem login manual yang sudah ada.

Jika seluruh scope dokumen ini selesai, user akan bisa memulihkan akses akun tanpa bantuan manual dari admin atau developer.
