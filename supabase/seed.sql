-- Data contoh awal (dihasilkan dari assets/js/seed.js).
-- Jalankan SETELAH schema.sql. Aman dijalankan ulang: navigasi dengan slug yang sama dilewati.

insert into public.sections (slug, label, type, heading, description, position, is_visible)
values ($q$resources$q$, $q$Resources$q$, $q$cards$q$, $q$Kumpulan *Resource*$q$, $q$Panduan, tools, dan kursus pilihan untuk menemani setiap tahap belajarmu.$q$, 1, true)
on conflict (slug) do nothing;

insert into public.sections (slug, label, type, heading, description, position, is_visible)
values ($q$knowledges$q$, $q$Knowledges$q$, $q$videos$q$, $q$Pustaka *Video*$q$, $q$Video pembelajaran yang disusun rapi, dari konsep dasar sampai membangun sendiri.$q$, 2, true)
on conflict (slug) do nothing;

insert into public.sections (slug, label, type, heading, description, position, is_visible)
values ($q$articles$q$, $q$Articles$q$, $q$articles$q$, $q$Artikel per *Topik*$q$, $q$Pilih satu topik, lalu baca artikelnya dengan tenang.$q$, 3, true)
on conflict (slug) do nothing;

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Prompt Engineering Guide$q$, $q$Panduan terbuka berisi teknik prompting dari dasar: zero-shot, few-shot, chain-of-thought, hingga pola agent.$q$, $q$Panduan$q$, array[$q$Prompting$q$]::text[], $q$beginner$q$, $q$https://www.promptingguide.ai/$q$, $q$$q$, $q$Panduan ini cocok dibaca berurutan kalau kamu baru mulai menulis prompt dengan serius.

### Yang bisa kamu pelajari
- Struktur prompt: instruksi, konteks, contoh, dan format keluaran
- Teknik **few-shot** dan **chain-of-thought**
- Pola lanjutan seperti ReAct dan prompt untuk agent

### Cara memakainya
Baca satu teknik, lalu langsung coba di tools AI favoritmu dengan tugasmu sendiri. Catat prompt yang berhasil sebagai template.$q$, 1, true
from public.sections where slug = $q$resources$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$resources$q$ and i.title = $q$Prompt Engineering Guide$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Dokumentasi n8n$q$, $q$Dokumentasi resmi n8n untuk membangun workflow otomasi — menghubungkan AI dengan form, spreadsheet, email, dan lainnya.$q$, $q$Tools$q$, array[$q$Otomasi$q$, $q$AI Agent$q$]::text[], $q$intermediate$q$, $q$https://docs.n8n.io/$q$, $q$$q$, $q$n8n adalah tools otomasi visual: kamu menyusun langkah-langkah (node) yang saling terhubung.

### Mulai dari bagian ini
- **Quickstart** untuk membuat workflow pertama
- **AI Agent node** untuk menghubungkan model AI ke tools lain
- Kumpulan template workflow yang bisa langsung disalin

Tips: mulai dari satu otomasi kecil yang menghemat waktumu setiap minggu.$q$, 2, true
from public.sections where slug = $q$resources$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$resources$q$ and i.title = $q$Dokumentasi n8n$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Hugging Face Learn$q$, $q$Kumpulan kursus gratis tentang LLM, AI agent, dan model open-source — lengkap dengan latihan praktik.$q$, $q$Kursus$q$, array[$q$LLM$q$, $q$AI Agent$q$]::text[], $q$advanced$q$, $q$https://huggingface.co/learn$q$, $q$$q$, $q$Tempat yang baik untuk naik level setelah kamu nyaman memakai AI sehari-hari.

### Kursus yang direkomendasikan
- **LLM Course** — cara kerja dan cara memakai model bahasa
- **Agents Course** — membangun agent dari nol

Siapkan waktu rutin, misalnya 30 menit per hari, dan kerjakan latihannya.$q$, 3, true
from public.sections where slug = $q$resources$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$resources$q$ and i.title = $q$Hugging Face Learn$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Large Language Models, Dijelaskan Singkat$q$, $q$Gambaran visual tentang cara kerja model bahasa besar dalam delapan menit. Oleh 3Blue1Brown.$q$, $q$$q$, array[$q$LLM$q$]::text[], $q$beginner$q$, $q$https://www.youtube.com/watch?v=LPZh9BOjkQs$q$, $q$7:58$q$, $q$$q$, 1, true
from public.sections where slug = $q$knowledges$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$knowledges$q$ and i.title = $q$Large Language Models, Dijelaskan Singkat$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Cara Saya Memakai LLM Sehari-hari$q$, $q$Tur praktis memakai berbagai fitur asisten AI untuk pekerjaan nyata. Oleh Andrej Karpathy.$q$, $q$$q$, array[$q$Prompting$q$, $q$LLM$q$]::text[], $q$beginner$q$, $q$https://www.youtube.com/watch?v=EWvNQjAaOHw$q$, $q$2:11:12$q$, $q$$q$, 2, true
from public.sections where slug = $q$knowledges$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$knowledges$q$ and i.title = $q$Cara Saya Memakai LLM Sehari-hari$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Pengantar Large Language Models$q$, $q$Ceramah satu jam tentang apa itu LLM, bagaimana dilatih, dan ke mana arahnya. Oleh Andrej Karpathy.$q$, $q$$q$, array[$q$LLM$q$]::text[], $q$intermediate$q$, $q$https://www.youtube.com/watch?v=zjkBMFhNj_g$q$, $q$59:48$q$, $q$$q$, 3, true
from public.sections where slug = $q$knowledges$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$knowledges$q$ and i.title = $q$Pengantar Large Language Models$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Transformer, Teknologi di Balik LLM$q$, $q$Penjelasan visual arsitektur transformer, langkah demi langkah. Oleh 3Blue1Brown.$q$, $q$$q$, array[$q$LLM$q$]::text[], $q$intermediate$q$, $q$https://www.youtube.com/watch?v=wjZofJX0v4M$q$, $q$27:14$q$, $q$$q$, 4, true
from public.sections where slug = $q$knowledges$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$knowledges$q$ and i.title = $q$Transformer, Teknologi di Balik LLM$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Membangun GPT dari Nol$q$, $q$Menulis model GPT sederhana baris demi baris dengan Python. Oleh Andrej Karpathy.$q$, $q$$q$, array[$q$LLM$q$, $q$AI Agent$q$]::text[], $q$advanced$q$, $q$https://www.youtube.com/watch?v=kCc8FmEb1nY$q$, $q$1:56:20$q$, $q$$q$, 5, true
from public.sections where slug = $q$knowledges$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$knowledges$q$ and i.title = $q$Membangun GPT dari Nol$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$5 Kebiasaan Prompt yang Membuat Hasil AI Lebih Tajam$q$, $q$Bukan soal kata ajaib. Lima kebiasaan kecil ini membuat jawaban AI lebih relevan sejak percobaan pertama.$q$, $q$$q$, array[$q$Prompting$q$]::text[], $q$beginner$q$, $q$$q$, $q$$q$, $q$Banyak orang mencari "prompt rahasia". Padahal hasil yang bagus biasanya datang dari kebiasaan sederhana yang dilakukan konsisten.

## 1. Ceritakan konteksnya
AI tidak tahu siapa kamu, untuk siapa hasilnya, dan apa tujuannya. Satu atau dua kalimat konteks sudah membuat perbedaan besar.

## 2. Tentukan bentuk hasilnya
Minta format yang jelas: daftar poin, tabel, tiga opsi judul, atau paragraf maksimal 100 kata.

## 3. Beri contoh
Kalau kamu punya contoh tulisan dengan gaya yang kamu suka, tempelkan. Contoh bekerja lebih baik daripada deskripsi panjang.

## 4. Pecah tugas besar
Daripada meminta satu artikel utuh, minta kerangka dulu, setujui, lalu kembangkan per bagian.

## 5. Perbaiki, jangan mulai ulang
Kalau hasilnya belum pas, katakan bagian mana yang kurang dan kenapa. AI akan memperbaiki dengan arah yang lebih tepat.

> Simpan prompt yang berhasil. Lama-lama kamu punya perpustakaan template pribadi.$q$, 1, true
from public.sections where slug = $q$articles$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$articles$q$ and i.title = $q$5 Kebiasaan Prompt yang Membuat Hasil AI Lebih Tajam$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Memahami AI Agent Tanpa Istilah yang Bikin Pusing$q$, $q$Apa bedanya chatbot dan agent? Penjelasan sederhana tentang cara agent berpikir, memakai tools, dan menyelesaikan tugas.$q$, $q$$q$, array[$q$AI Agent$q$, $q$LLM$q$]::text[], $q$intermediate$q$, $q$$q$, $q$$q$, $q$Chatbot menjawab pertanyaan. **Agent** menyelesaikan tugas.

## Siklus sederhana sebuah agent
1. **Memahami tujuan** — misalnya "rangkum email penting hari ini".
2. **Merencanakan langkah** — buka kotak masuk, pilih email penting, buat ringkasan.
3. **Memakai tools** — membaca email, menulis dokumen, mengirim pesan.
4. **Mengecek hasil** — apakah tujuan sudah tercapai? Kalau belum, ulangi.

## Kapan butuh agent?
Ketika tugasnya terdiri dari beberapa langkah dan butuh akses ke aplikasi lain. Untuk pertanyaan sekali jawab, chatbot biasa sudah cukup.

## Mulai dari yang kecil
Pilih satu tugas berulang yang membosankan, lalu bayangkan langkah-langkahnya. Itu adalah rancangan agent pertamamu.$q$, 2, true
from public.sections where slug = $q$articles$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$articles$q$ and i.title = $q$Memahami AI Agent Tanpa Istilah yang Bikin Pusing$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Otomasi Pertama Kamu: Dari Form ke Ringkasan Otomatis$q$, $q$Contoh alur otomasi sederhana: jawaban form masuk, AI merangkumnya, dan ringkasan terkirim ke timmu.$q$, $q$$q$, array[$q$Otomasi$q$]::text[], $q$intermediate$q$, $q$$q$, $q$$q$, $q$Otomasi pertama sebaiknya kecil, jelas, dan langsung terasa manfaatnya.

## Alurnya
- **Pemicu**: ada jawaban baru di form pendaftaran
- **Proses**: AI membaca jawaban dan membuat ringkasan tiga kalimat
- **Hasil**: ringkasan dikirim ke grup tim atau disimpan ke spreadsheet

## Yang perlu disiapkan
- Akun tools otomasi, misalnya n8n
- Form yang sudah berjalan
- Prompt ringkasan yang sudah kamu uji manual

## Tips
Uji prompt-nya secara manual dulu sampai hasilnya konsisten. Baru setelah itu pasang di otomasi.$q$, 3, true
from public.sections where slug = $q$articles$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$articles$q$ and i.title = $q$Otomasi Pertama Kamu: Dari Form ke Ringkasan Otomatis$q$);

insert into public.items (section_id, title, summary, category, tags, level, url, duration, body, position, published)
select id, $q$Merancang Alur Konten Mingguan dengan Bantuan AI$q$, $q$Cara membagi kerja dengan AI: kamu pegang ide dan rasa, AI membantu riset, draf, dan variasi.$q$, $q$$q$, array[$q$Konten$q$, $q$Prompting$q$]::text[], $q$beginner$q$, $q$$q$, $q$$q$, $q$AI paling berguna untuk konten ketika perannya jelas.

## Senin: kumpulkan ide
Tulis 10 ide mentah. Minta AI mengelompokkan dan menambahkan sudut pandang baru.

## Selasa: riset & kerangka
Pilih tiga ide, minta AI membuat kerangka dan daftar pertanyaan yang biasa ditanyakan audiens.

## Rabu–Kamis: draf
Tulis versi pertamamu sendiri, lalu minta AI merapikan, memendekkan, atau membuat variasi caption.

## Jumat: evaluasi
Tempelkan hasil performa konten, minta AI mencari pola: topik dan format mana yang paling berhasil.

> Suaramu tetap milikmu. AI membantu mempercepat, bukan menggantikan.$q$, 4, true
from public.sections where slug = $q$articles$q$
and not exists (select 1 from public.items i join public.sections s2 on s2.id = i.section_id where s2.slug = $q$articles$q$ and i.title = $q$Merancang Alur Konten Mingguan dengan Bantuan AI$q$);

