# Planning Implementasi Approval Setelah Register

## Judul Proyek
Perancangan Sistem Informasi Point of Sale (POS) pada Toko UMKM untuk Meningkatkan Efektivitas Pengelolaan Transaksi Menggunakan Model SDLC Waterfall

## Tujuan Dokumen
Dokumen ini menjadi acuan implementasi alur registrasi yang harus menunggu approval admin sebelum user bisa login.

Fokusnya adalah:
- setelah register, user melihat notifikasi bahwa akun masih menunggu approval
- user tidak bisa login sebelum admin memberi role atau menyetujui akun
- admin punya alur sederhana untuk menyetujui akun dan memberi role
- tahapan kerja dibuat jelas agar bisa dikerjakan oleh junior programmer atau model AI yang lebih murah

## Masalah Yang Ingin Diselesaikan
Saat ini registrasi manual langsung membuat akun siap dipakai.

Akibatnya:
- akun baru bisa masuk tanpa validasi admin
- role belum tentu diberikan dengan benar
- admin tidak punya kontrol atas user baru
- data user bisa bertambah tanpa proses verifikasi internal

## Target Akhir
Setelah implementasi selesai:
- user berhasil register lalu melihat pesan `menunggu approval admin`
- user tidak bisa login sebelum disetujui
- admin bisa melihat daftar user pending
- admin bisa memberi role terlebih dahulu sebelum user login
- user baru hanya bisa login jika status dan role sudah valid

## Scope Fitur
Planning ini hanya membahas approval setelah register.

Termasuk di dalam scope:
- status user setelah register
- notifikasi pending approval di UI register
- validasi login berdasarkan status approval
- halaman atau komponen admin untuk approval user
- pemberian role sebelum login diizinkan

Tidak wajib pada issue ini:
- approval berlapis
- verifikasi email
- OTP
- persetujuan multi-admin
- riwayat approval lengkap

## Keputusan Teknis Yang Direkomendasikan
Gunakan pendekatan approval state di database.

Alur yang disarankan:
1. user register
2. sistem menyimpan user dengan status `pending`
3. admin membuka daftar user pending
4. admin menyetujui user dan memberi role
5. status berubah menjadi `approved`
6. user baru boleh login

## Kenapa Flow Ini Dipilih
- cocok dengan sistem auth manual yang sudah ada
- mudah dijelaskan dalam dokumen Waterfall
- cocok untuk kontrol user di aplikasi POS
- lebih aman daripada akun langsung aktif

## Prinsip Implementasi
1. User baru tidak otomatis aktif.
2. Login harus gagal jika user belum disetujui.
3. Approval harus menyimpan role yang jelas.
4. Admin harus bisa melihat status user baru.
5. UI harus memberi pesan yang mudah dipahami user.

## Data Yang Dibutuhkan
Untuk mendukung approval, sistem perlu menyimpan informasi berikut:
- status approval user
- siapa yang menyetujui
- kapan user disetujui
- role yang diberikan
- catatan approval jika diperlukan

## Struktur Implementasi Yang Disarankan

### 1. Tambahkan status approval pada user
Tambahkan penanda status pada tabel `users`.

Kolom yang disarankan:
- `approval_status`
- `approved_at`
- `approved_by`
- `approval_note`

Status yang disarankan:
- `pending`
- `approved`
- `rejected`

Catatan:
- user baru harus otomatis `pending`
- login hanya boleh jika status `approved`
- status `rejected` dipakai jika admin menolak akun

### 2. Validasi login berdasarkan approval
Endpoint login harus mengecek status approval sebelum membuat session.

Contoh file:
- `src/app/api/login/route.ts`

Tanggung jawab:
- cek apakah user terdaftar
- cek password benar
- cek status approval
- cek role sudah diberikan
- tolak login jika user masih pending

### 3. Tampilkan notifikasi setelah register
Setelah registrasi berhasil, UI harus memberi pesan bahwa akun menunggu approval admin.

Contoh file:
- `src/components/auth/auth-card.tsx`

Tanggung jawab:
- tampilkan pesan sukses register
- jelaskan bahwa user belum bisa login
- arahkan user menunggu approval dari admin

### 4. Buat alur approval di admin
Admin perlu halaman untuk melihat user pending dan memberi approval.

Contoh file:
- `src/components/admin/user-approval-management.tsx`
- `src/app/dashboard/admin/approvals/page.tsx`

Tanggung jawab:
- tampilkan daftar user pending
- admin bisa approve user
- admin bisa memilih role yang akan diberikan
- simpan tanggal dan admin yang melakukan approval

### 5. Integrasikan approval dengan role assignment
User baru baru dianggap aktif jika role sudah diberikan.

Contoh tabel yang dipakai:
- `users`
- `user_store_roles`
- `roles`
- `stores`

Tanggung jawab:
- saat approve, admin menentukan role
- sistem membuat atau memperbarui assignment role
- login hanya sukses jika assignment role valid

### 6. Tambahkan status UI untuk admin
Admin perlu melihat status user dengan jelas.

Status yang disarankan:
- pending
- approved
- rejected

Tanggung jawab:
- tampilkan badge status
- tampilkan filter status
- tampilkan aksi approve/reject

## Tahapan Implementasi

### 1. Audit flow register dan login saat ini
Tujuan: memahami alur autentikasi manual sebelum menambahkan approval.

#### File yang dibaca
- `src/app/api/users/route.ts`
- `src/app/api/login/route.ts`
- `src/components/auth/auth-card.tsx`
- `supabase/migrations/0002_create_manual_users_table.sql`

#### Yang harus dipahami
- registrasi langsung insert ke tabel `users`
- login hanya cek email dan password
- belum ada status approval
- belum ada validasi role sebelum login

#### Output
- daftar titik integrasi yang harus diubah

### 2. Tentukan model approval final
Tujuan: jangan coding sebelum aturan approval disepakati.

#### Keputusan yang disarankan
- user baru default `pending`
- admin yang memberi approval
- approval sekaligus memberi role
- login hanya boleh jika status `approved`

#### Output
- model approval final jelas dan tidak berubah-ubah

### 3. Tambahkan migration approval status
Tujuan: database punya tempat untuk menyimpan status approval.

#### Task
- tambah kolom approval pada `users`
- buat index jika diperlukan
- pastikan user baru default `pending`

#### Acceptance Criteria
- user baru tersimpan sebagai pending
- status approval bisa dibaca oleh login dan admin UI

### 4. Ubah flow registrasi
Tujuan: user yang selesai register langsung tahu bahwa akun belum aktif.

#### Task
- tetap simpan data registrasi
- pastikan response register menyebut status pending
- update UI agar menampilkan pesan menunggu approval

#### Acceptance Criteria
- setelah register, user melihat notifikasi approval
- user tidak mengira akun sudah siap dipakai

### 5. Ubah flow login
Tujuan: user pending tidak bisa masuk ke sistem.

#### Task
- cek status approval setelah password valid
- cek apakah role sudah diberikan
- tolak login jika status belum `approved`
- tampilkan pesan yang jelas dan aman

#### Acceptance Criteria
- user pending gagal login
- user approved bisa login

### 6. Buat halaman atau komponen approval admin
Tujuan: admin bisa memproses user baru.

#### Task
- tampilkan daftar user pending
- sediakan tombol approve
- sediakan aksi reject jika diperlukan
- sediakan pilihan role saat approval

#### Acceptance Criteria
- admin dapat menyetujui user dari UI
- role dapat diberikan pada saat approval

### 7. Hubungkan approval dengan role assignment
Tujuan: approval punya efek nyata ke hak akses user.

#### Task
- saat approve, buat atau update assignment role
- simpan store yang dipakai jika sistem membutuhkannya
- pastikan user tanpa role tetap tidak bisa login

#### Acceptance Criteria
- approval menghasilkan role yang valid
- login baru aktif setelah role tersedia

### 8. Tambahkan feedback UI yang jelas
Tujuan: user dan admin memahami status akun tanpa bingung.

#### Task
- tampilkan badge pending di admin
- tampilkan notifikasi pending di register
- tampilkan pesan penolakan jika status rejected

#### Acceptance Criteria
- status akun mudah dipahami pengguna

### 9. Uji manual end-to-end
Tujuan: memastikan alur register sampai approval bekerja benar.

#### Skenario Uji
1. user register
2. user melihat pesan menunggu approval
3. user coba login
4. sistem menolak login karena pending
5. admin membuka daftar pending user
6. admin approve user dan memberi role
7. user login kembali
8. login berhasil

## Urutan Implementasi Teknis
Urutan kerja yang disarankan:
1. audit flow register dan login
2. tentukan model approval final
3. tambah migration approval status
4. ubah response registrasi
5. ubah validasi login
6. buat UI approval admin
7. sambungkan approval ke role assignment
8. tambahkan notifikasi UI
9. uji manual

## Pembagian Task Untuk Junior Programmer / AI Murah
Setiap task harus kecil dan spesifik.

### Format Task Yang Disarankan
- tujuan
- file yang diubah
- status user yang terdampak
- role admin yang terdampak
- output yang diharapkan
- langkah uji manual

### Contoh Task Yang Baik
- tambah status approval pada tabel users
- tolak login jika status pending
- tampilkan notifikasi menunggu approval setelah register
- buat daftar user pending di admin
- approve user dan berikan role

### Contoh Task Yang Terlalu Besar
- perbaiki seluruh sistem auth
- buat sistem approval kompleks
- redesign semua halaman user dan admin sekaligus

## Daftar Issue Kecil Yang Direkomendasikan
1. Audit flow register dan login saat ini
2. Tambahkan status approval pada tabel users
3. Ubah response registrasi menjadi pending approval
4. Ubah validasi login agar menolak user pending
5. Tampilkan notifikasi menunggu approval setelah register
6. Buat halaman approval admin
7. Buat aksi approve dan reject user
8. Sambungkan approval dengan pemberian role
9. Tambahkan badge status user
10. Uji manual alur register sampai login

## Skenario Uji Manual Minimal
- user register sukses
- user melihat pesan menunggu approval admin
- user pending gagal login
- admin melihat user pending
- admin approve user dan memberi role
- user approved bisa login
- user rejected tetap tidak bisa login

## Definition of Done
Satu issue dianggap selesai jika:
- status pending tersimpan benar
- login user pending ditolak
- admin bisa approve user
- role diberikan saat approval
- UI menampilkan pesan yang jelas
- ada pengujian manual

## Catatan Penting Untuk Implementor
- jangan membuat user baru langsung aktif
- jangan mengizinkan login tanpa approval
- jangan menyimpan status approval secara tidak konsisten
- jangan memberi role sebelum proses approval jelas
- jangan membocorkan detail internal saat login gagal

## Penutup
Target terbaik untuk fitur ini adalah alur registrasi yang aman dan terkontrol:
- user daftar
- user menunggu approval
- admin memberi role
- user baru bisa login

Dengan alur ini, sistem POS lebih tertata dan admin punya kontrol penuh atas akun yang boleh masuk ke aplikasi.
