<img width="1901" height="952" alt="Screenshot 2026-11-16 124731" src="https://github.com/user-attachments/assets/a3b4493a-e287-4d5f-b183-e43d55f05376" />

# folio.sma
**folio.sma** merupakan aplikasi berbasis web untuk menyimpan sertifikat perlombaan, kepanitiaan, dan rekam organisasi sekaligus menyusunnya menjadi portofolio otomatis bagi pelajar SMA maupun SMK sederajat. Proyek ini dikembangkan untuk menjawab masalah dokumen prestasi pelajar yang sering terpisah-pisah karena rentang waktu kegiatan yang berjauhan, sehingga berkas sertifikatnya siap digunakan kapan saja tanpa perlu menyusun folder secara manual.

Akses langsung website melalui tautan 
[folio.sma](https://theonly-archive.github.io/folio.sma).

## Teknologi yang Digunakan
* **HTML & CSS** sebagai kerangka struktur multi-halaman dan tata letak responsif dengan sistem desain warna solid 60-30-10 serta grid statistik Bento.
* **JavaScript** untuk logika interaktif, pengelompokan otomatis, dan pengkodean parameter URL pada fitur berbagi tautan.
* **IndexedDB & LocalStorage** sebagai penyimpanan lokal di dalam browser pengguna agar dokumen gambar maupun PDF tersimpan aman tanpa memerlukan server backend.
* **Lucide Icons & Google Fonts** (`Plus Jakarta Sans` dan `Inter`) untuk ikon vektor dan tipografi UI.
* **GitHub & GitHub Pages** sebagai repositori kode sumber dan layanan publikasi (*hosting*) situs web.

## Pemanfaatan AI (AI Usage Disclosure)
Dalam pengembangan proyek ini, kami memanfaatkan **Google Gemini** sebagai asisten pemrograman dan diskusi perancangan. Salah satu perintah (*prompt*) utama yang kami gunakan pada tahap penyusunan kode adalah sebagai berikut.

> *"Buatkan struktur file HTML, CSS, dan JS terpisah (index.html, arsip.html, portofolio.html, css/style.css, js/app.js) untuk folio.sma. Gunakan palet warna dominan krem (#fff8f0) dan merah gelap (#92140c), larang penggunaan emoji, hapus gradasi dan bayangan, serta keluarkan kode murni tanpa komentar penjelasan."*

Terhadap saran dan keluaran kode dari AI, kemudian kami melakukan beberapa penyesuaian. Kami menghapus seluruh data contoh (*dummy*) bawaan AI agar aplikasi dimulai bersih dari nol, mengubah istilah UI yang kaku menjadi kosakata yang lebih mudah dipahami (seperti **Dokumen**, **Simpan Dokumen**, dan **Cadangan Data**), menyesuaikan proporsi tata letak serta animasi mikro pada CSS, mengisolasi tampilan penerima saat tautan portofolio dibagikan, serta melakukan pengujian langsung bersama 9 rekan pelajar untuk memastikan kenyamanan penggunaan. Catatan interaksi selengkapnya terdokumentasi pada berkas [AI_LOGBOOK.md](AI_LOGBOOK.md).

## Panduan Penggunaan
1. **Unggah Berkas:** Buka halaman utama **Beranda**, lalu tarik dan lepaskan (*drag and drop*) file sertifikat berformat JPG, PNG, atau PDF ke kotak unggah (atau klik tombol **Pilih Dokumen**).
2. **Pengkategorian dalam Tiga Klik:** Pada jendela *pop-up* yang muncul, pilih tiga kategori singkat meliputi **Jenis Dokumen**, **Bidang**, dan **Tahun**, lalu tekan **Simpan Dokumen**.
3. **Kelola & Cadangkan Dokumen:** Buka menu **Dokumen** untuk mencari berkas, menyaring berdasarkan kategori, melihat pratinjau dokumen, atau menekan tombol **Cadangan Data** untuk mengunduh file cadangan `.json` maupun memulihkan data di perangkat lain.
4. **Susun & Bagikan Portofolio:** Buka menu **Portofolio** untuk melihat ringkasan statistik otomatis, mengatur identitas melalui **Edit Profil**, mencetak dokumen ke format kertas A4 melalui **Cetak PDF**, atau menyalin tautan publik portofolio lewat menu titik tiga (**Bagikan Tautan**).

## Identitas Pengembang
* **Anggota 1:** Pandu Bittama Nurindra — Kelas 10 — SMA Negeri 1 Madiun
* **Anggota 2:** Zalshabilla Skriva Alkhallifi — Kelas 10 — SMA Negeri 1 Madiun
* **Kegiatan:** Pelatihan TIK bagi Murid (LATIKA) Tahun 2026 — Gelombang 4 Wilayah Kota Madiun
