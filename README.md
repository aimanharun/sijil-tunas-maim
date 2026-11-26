# Sijil Tunas MAIM

Aplikasi untuk menyediakan sijil peserta daripada fail Excel dan templat PDF. Dibina dengan React, TypeScript dan Vite.

## Demo

[Cuba demo Sijil Tunas MAIM](https://sijil-tunas-maim.pages.dev/)

## Jalankan di komputer

```bash
npm ci
npm run dev
```

Buka alamat yang dipaparkan oleh Vite. Untuk menguji binaan pengeluaran:

```bash
npm run build
npm run preview
```

## Deploy ke Cloudflare Pages

Tetapkan **Build command** kepada `npm run build` dan **Build output directory** kepada `dist`. Lihat [CLOUDFLARE.md](CLOUDFLARE.md) untuk butiran lanjut.

Fail Excel diproses dalam pelayar. Data peserta yang dimuat naik perlu dimasukkan semula selepas halaman dimuat semula.
