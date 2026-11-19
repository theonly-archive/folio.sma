# folio.sma

Project website ini dirancang dan dikembangkan oleh Pandu Bittama Nurindra (Pandu) dan Zalshabilla Skriva Alkhallifi (Zalsha) dari SMA Negeri 1 Madiun untuk memenuhi tugas akhir Pelatihan TIK LATIKA Gelombang 4 dengan memanfaatkan Google Gemini sebagai asisten pemrograman kami. Kami juga membagi peran dalam pengerjaannya, Pandu yang bertanggung jawab menyusun JavaScript dan HTML, dan menyesuaikan gaya pada CSS. Sementara itu Zalsha bertugas menyesuaikan sebagian gaya pada CSS dan pengecekan tampilan UI ketika berhasil dideploy.

## Tahap 1: Eksplorasi Ide dan Perancangan Solusi

### Interaksi dan Prompt Awal Kami kepada AI
Pada tahap paling awal kami memulai diskusi dengan menceritakan latar belakang masalah yang sering dialami pelajar SMA saat mengarsipkan berkas kegiatan. Berikut merupakan kutipan perintah awal yang kami kirimkan kepada Gemini.

> Saya merupakan salah satu peserta pelatihan pemrograman menggunakan GitHub di Kota Madiun yang mendapatkan tenggat waktu pengerjaan proyek selama delapan hari. Awalnya saya terpikir membuat website konverter file, namun ide tersebut terasa terlalu umum dan pasaran. Berdasarkan pengalaman pribadi sejak SMP, saya selalu kesulitan mengarsipkan sertifikat lomba, kepanitiaan, dan organisasi sekolah karena rentang waktunya berjauhan sehingga banyak file tercecer, lupa ditaruh, atau terhapus. Saya ingin membuat website portofolio otomatis yang tidak terasa flat, di mana halaman utamanya langsung menampilkan area unggah file dan memunculkan pop up pertanyaan singkat untuk mengelompokkan berkas tanpa perlu repot membuat folder manual. Apakah ide seperti ini rasional dijalankan di GitHub?
<img width="1347" height="1047" alt="Screenshot 2026-11-18 223625" src="https://github.com/user-attachments/assets/cc2e506a-4596-49d5-aaef-53dfcf72493b" />
Gemini merespons bahwa konsep tersebut sangat relevan dan dapat diwujudkan sepenuhnya di GitHub Pages tanpa memerlukan server backend. AI menyarankan penggunaan IndexedDB di dalam peramban agar berkas gambar maupun PDF tersimpan secara lokal di perangkat pengguna, serta mengusulkan alur tiga klik cepat setelah file dipilih agar pengguna tidak merasa terbebani.

### Validasi dan Modifikasi Mandiri
Pada rancangan awal, kami sempat menamai aplikasi ini folio.smasa yang ditujukan khusus bagi lingkungan sekolah kami. Setelah berdiskusi lebih lanjut mengenai kebermanfaatan produk, kami memutuskan mengubah identitasnya menjadi folio.sma dan menghapus seluruh keterangan spesifik sekolah agar dapat dipakai oleh pelajar SMA maupun SMK sederajat di mana saja. Kami juga menambahkan fitur unduh cadangan data serta fitur bagikan tautan karena penyimpanan lokal di peramban berisiko hilang apabila pengguna membersihkan riwayat browser.

## Tahap 2 Penyusunan Kerangka Kode

### Interaksi dan Prompt kepada AI
Setelah alur aplikasi disepakati, kami meminta Gemini menyusun kerangka kode yang terpisah ke dalam lima berkas yakni index.html, arsip.html, portofolio.html, css/style.css, dan js/app.js agar tidak menumpuk dalam satu halaman. Kami menetapkan aturan palet warna krem hangat dan merah gelap, melarang penggunaan emoji, menghapus gradasi maupun bayangan, serta meminta keluaran kode murni tanpa komentar penjelasan. Gemini kemudian menghasilkan kerangka tiga halaman HTML yang terhubung ke satu pusat gaya CSS dan satu pengontrol logika JavaScript.

### Validasi dan Modifikasi Mandiri
Pada draf kode awal yang diberikan oleh AI, halaman daftar dokumen dan portofolio masih terisi oleh data contoh bawaan serta istilah-istilah yang terasa kaku seperti Lemari Arsip dan Ekspor JSON. Kami membersihkan seluruh data tiruan tersebut agar aplikasi dimulai dalam keadaan kosong dari nol, lalu mengganti kosakata antarmukanya menjadi kata yang lebih akrab seperti Dokumen, Simpan Dokumen, dan Cadangan Data.

## Tahap 3 Penyempurnaan Antarmuka dan Fitur Tambahan

### Interaksi dan Prompt kepada AI
Setelah kerangka dasar berjalan, kami kembali berdiskusi dengan Gemini untuk menyempurnakan pengalaman pengguna pada halaman portofolio. Kami meminta AI membantu merancang penggabungan tombol aksi ke dalam menu titik tiga, membuat mode pratinjau penuh, serta menyusun logika berbagi tautan portofolio melalui pengkodean parameter URL tanpa server.

### Validasi dan Modifikasi Mandiri
Zalshabilla menyesuaikan proporsi jarak ruang, ukuran ikon, dan garis tepi kartu pada CSS agar dokumen terlihat rapi dan tidak sesak, sementara Pandu menambahkan animasi transisi ringan berbasis transform dan opacity pada tombol serta kartu agar interaksi layar terasa lebih responsif. Selain itu, pada fitur bagikan tautan portofolio, Pandu memodifikasi logika JavaScript agar menyembunyikan menu navigasi atas dan tombol pengaturan saat tautan dibuka oleh orang lain, sehingga penerima tautan hanya melihat halaman portofolio pemilik beserta tombol ajakan untuk membuat portofolio sendiri.

## Tahap 4 Pemecahan Masalah dan Penanganan Galat

### Interaksi dan Prompt kepada AI
Ketika menguji fitur cetak PDF pada halaman portofolio, kami menemukan kendala berupa kartu statistik keempat yang terpotong ke halaman berikutnya, tombol navigasi web ikut tercetak di kertas, serta nama file yang panjang tanpa spasi menabrak garis pinggir kartu. Kami menginstruksikan Gemini untuk memperbarui aturan cetak pada file CSS agar tata letak kertas A4 menjadi bersih dan hemat tinta. Gemini memberikan penyesuaian pada blok media print untuk menyembunyikan tombol interaktif, mensejajarkan empat kartu statistik dalam satu baris mendatar, serta menambahkan aturan pemecah kata otomatis untuk teks panjang.

### Validasi dan Modifikasi Mandiri
Setelah memperbarui kode CSS di repositori GitHub, tampilan cetak sempat tidak berubah karena peramban masih menyimpan memori lama. Kami melakukan pembersihan cache melalui muat ulang paksa hingga seluruh halaman cetak berhasil muat secara utuh dalam satu lembar A4 secara presisi.

## Tahap 5 Refleksi dan Penjelasan Kode

### Pemahaman Alur Kerja Program
Seluruh berkas sertifikat yang diunggah pengguna disimpan ke dalam database lokal peramban bernama FolioSmaDB menggunakan IndexedDB karena kapasitasnya jauh lebih besar dibanding LocalStorage untuk menampung file gambar maupun PDF, sedangkan data identitas pemilik disimpan melalui LocalStorage. Saat pengguna memilih tiga kategori pada jendela unggah, fungsi di dalam js/app.js menggabungkan pilihan tersebut menjadi format penamaan file standar sebelum menyimpannya ke database. Halaman portofolio kemudian membaca data dari database tersebut untuk menghitung jumlah pencapaian pada tiap kategori secara otomatis sekaligus menampilkan pratinjau visual dokumen secara langsung.

### Validasi dan Modifikasi Mandiri
Melalui proses pengembangan proyek ini, kami memahami bahwa kecerdasan artifisial sangat membantu mempercepat penyusunan struktur kode dan pencarian solusi galat, namun ketepatan antarmuka, kesesuaian alur kerja pengguna, serta kebersihan logika tetap bergantung pada verifikasi dan modifikasi mandiri yang kami lakukan pada setiap tahapnya.
