/*
 * Konfigurasi portal.
 *
 * SUPABASE_URL & SUPABASE_ANON_KEY: ambil dari Supabase → Project Settings → API.
 * Selama keduanya kosong, portal berjalan dalam MODE DEMO: data contoh dimuat
 * dan semua perubahan disimpan di browser ini saja (localStorage).
 */
window.ACL_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Password admin khusus MODE DEMO: email apa pun bisa masuk sebagai admin
  // asalkan memakai password ini. Tidak dipakai setelah Supabase diisi
  // (admin asli dibuat di Supabase Auth — lihat README.md).
  DEMO_ADMIN_PASSWORD: "4dm1n123",
};
