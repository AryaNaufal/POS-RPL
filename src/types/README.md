# POS System Type Definitions

Folder ini berisi semua definisi tipe TypeScript yang digunakan di seluruh aplikasi. Tujuannya adalah untuk menjaga konsistensi data antara database, API, dan komponen UI.

## Struktur Folder

- `auth/`: Tipe yang berkaitan dengan autentikasi dan otorisasi (session, permission).
- `common/`: Tipe umum yang digunakan di banyak tempat (API response, enums, options).
- `entities/`: Representasi satu-ke-satu dari tabel database.
- `forms/`: Tipe untuk input form (Create/Update inputs).
- `views/`: Tipe untuk data hasil join atau tampilan khusus (Dashboard, Reports).

## Aturan Penggunaan

1. **Gunakan Entity Type**: Selalu gunakan tipe dari `entities/` saat menangani data mentah dari database.
   ```ts
   import type { Product } from '@/types/entities/product';
   ```

2. **Jangan Inline Type**: Hindari mendefinisikan tipe objek di dalam komponen jika data tersebut berasal dari database.

3. **Gunakan Enums**: Gunakan tipe enum dari `common/enums.ts` untuk status dan tipe yang memiliki nilai terbatas.

4. **Penamaan**:
   - Entity: `Name` (e.g., `User`, `Product`)
   - Form: `ActionNameInput` (e.g., `CreateProductInput`)
   - View/Join: `NameWithRelation` (e.g., `ProductWithCategory`)

## Cara Menambah Tipe Baru

1. Jika tabel database baru dibuat, buat file baru di `entities/`.
2. Jika ada endpoint API baru yang mengembalikan data join, buat tipe di `views/`.
3. Jika ada form baru, buat tipe di `forms/`.
