# Ruang Belajar AI — Portal AI Creator Labs

Landing page berbentuk portal publik untuk materi belajar AI. Dibuat dengan HTML, CSS, dan JavaScript biasa (tanpa framework, tanpa proses build), memakai **Supabase** sebagai database.

## Isi

| Halaman | Alamat | Keterangan |
|---|---|---|
| Beranda | `index.html#/` | Label kecil, judul serif dengan satu kata italic, navigasi, tombol kapsul, kolom input bergaya chat, rekomendasi |
| Resources | `#/resources` | Grid kartu (judul, deskripsi, kategori). Klik → pop-up detail + link |
| Knowledges | `#/knowledges` | Pustaka video (thumbnail, judul, durasi). Klik → video YouTube diputar di pop-up |
| Articles | `#/articles` → `#/articles/tag/<tag>` → `#/articles/baca/<id>` | Pilih tag, lalu daftar artikel, lalu baca di website ini |
| Cari | `#/cari?q=…` / `?tag=…` / `?level=…` | Hasil dari kolom chat dan tombol kapsul |
| Masuk | `#/masuk` | **Halaman pertama** untuk semua orang. Pilihan **Pengguna** (email saja) atau **Admin** (email + password). Halaman lain baru bisa dibuka setelah masuk |
| Kuesioner | `#/kuesioner` | 5 pertanyaan untuk pengguna baru → level Beginner / Intermediate / Advanced |
| Admin | `admin.html` | Kelola navigasi dan item di setiap navigasi, lihat pengguna terdaftar |

Navigasi atas menempel (sticky) saat halaman digulir, dan ikon rumah di sebelah kiri membawa kembali ke beranda.

## Struktur file

```
index.html            Portal publik
admin.html            Halaman admin
assets/css/style.css  Semua gaya (warna, font, komponen, responsif)
assets/js/config.js   ← isi kunci Supabase di sini
assets/js/seed.js     Data contoh (mode demo)
assets/js/store.js    Lapisan data: Supabase atau mode demo
assets/js/ui.js       Komponen bersama: modal, markdown, latar partikel, ikon
assets/js/app.js      Logika portal
assets/js/admin.js    Logika admin
supabase/schema.sql   Tabel, keamanan (RLS), dan fungsi database
supabase/seed.sql     Data contoh untuk Supabase
```

## 1. Coba dulu di komputer (mode demo)

Selama `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `assets/js/config.js` masih kosong, portal berjalan dalam **mode demo**: data contoh langsung tampil, dan semua perubahan disimpan di browser itu saja.

Jalankan server lokal dari folder proyek:

```
python -m http.server 5173
```

Lalu buka `http://localhost:5173`. Video YouTube butuh server seperti ini, karena tidak bisa diputar kalau `index.html` dibuka langsung dengan klik dua kali.

Di mode demo, **email apa pun** bisa masuk sebagai admin asalkan memakai password `DEMO_ADMIN_PASSWORD` di `assets/js/config.js`. Aturan ini hanya berlaku di mode demo.

## 2. Hubungkan ke Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor → New query**, tempel isi `supabase/schema.sql`, lalu klik **Run**.
3. (Opsional) Jalankan `supabase/seed.sql` dengan cara yang sama untuk memasukkan data contoh: 3 resource, 5 video, dan 4 artikel.
4. **Buat akun admin:** buka **Authentication → Users → Add user → Create new user**, isi email dan password, lalu centang *Auto Confirm User*. Setelah itu jalankan perintah ini di SQL Editor (ganti emailnya):
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'email-admin@domain.com';
   ```
5. Buka **Project Settings → API**, salin **Project URL** dan **anon public key**, lalu tempel ke `assets/js/config.js`:
   ```js
   SUPABASE_URL: "https://xxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGciOi...",
   ```
   Anon key memang aman ditaruh di website. Keamanan data dijaga oleh aturan RLS di `schema.sql`. **Jangan** pernah menaruh `service_role` key di website.
6. Buka portal lagi. Kotak "Mode demo" akan hilang, dan data diambil dari Supabase.

## 3. Online-kan

Website ini statis, jadi cukup unggah seluruh folder ke hosting statis seperti Netlify, Vercel, Cloudflare Pages, atau GitHub Pages. Tidak perlu perintah build.

## Cara admin mengelola konten

- **Menambah atau mengurangi navigasi:** di panel kiri admin, klik **Tambah**. Isi nama (misalnya `Tools`), pilih bentuk tampilan (*Kartu resource*, *Pustaka video*, atau *Artikel per tag*), lalu simpan. Navigasi langsung muncul di portal. Navigasi bisa disembunyikan, diedit, dihapus, atau diurutkan dengan tombol panah.
- **Menambah atau mengurangi item:** pilih navigasi, lalu klik **Tambah item**. Item bisa diurutkan, dijadikan draf (disembunyikan), diedit, atau dihapus. Jumlah item tidak dibatasi.
- **Level** di setiap item dipakai untuk rekomendasi setelah kuesioner. **Tag** yang paling sering dipakai otomatis menjadi tombol kapsul di beranda.
- **Judul halaman:** beri tanda bintang pada satu kata supaya tampil miring, misalnya `Kumpulan *Tools*`.
- **Isi artikel dan detail resource** mendukung format sederhana: `## Subjudul`, `- daftar`, `1. daftar`, `**tebal**`, `*miring*`, `> kutipan`, `[teks](https://link)`.

## Catatan penting

- **Login pengguna tanpa password** artinya siapa pun yang mengetik email seseorang bisa masuk sebagai orang itu. Saat ini yang disimpan hanya level dan jawaban kuesioner, jadi risikonya kecil. Kalau nanti ada data pribadi, sebaiknya pakai *magic link* Supabase (pengguna mengklik tautan di email).
- **Video contoh** di Knowledges adalah video publik dari YouTube (3Blue1Brown dan Andrej Karpathy) yang diputar lewat embed resmi YouTube. Ganti dengan video milik AI Creator Labs lewat halaman admin sebelum dipublikasikan.
- **Aset & lisensi:** font Instrument Serif dan Manrope dari Google Fonts (SIL Open Font License). Logo, ikon, dan visual latar dibuat sendiri dengan SVG dan CSS, tanpa gambar berhak cipta. Logo AI Creator Labs yang resmi tidak dipakai, dan warnanya tidak menyalin situs acuan.
- Logo di pojok kiri atas adalah tanda sementara. Kalau logo resmi sudah ada, ganti `mark` di `assets/js/ui.js` dan `assets/img/favicon.svg`.
