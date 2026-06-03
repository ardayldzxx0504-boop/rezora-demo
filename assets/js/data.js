/* ===========================================================
   Rezora — Demo Data
   Realistic seed data for Northern Cyprus (KKTC)
   =========================================================== */

const REZORA = {
  cities: ["Lefkoşa", "Girne", "Gazimağusa", "Güzelyurt", "İskele", "Lefke"],

  categories: [
    { id: "barber",     name: "Berber",        icon: "scissors",   count: 2 },
    { id: "salon",      name: "Kuaför",        icon: "sparkles",   count: 1 },
    { id: "restaurant", name: "Restoran",      icon: "utensils",   count: 124 },
    { id: "halisaha",   name: "Halı Saha",     icon: "ball",       count: 31 },
    { id: "vet",        name: "Veteriner",     icon: "paw",        count: 22 },
    { id: "auto",       name: "Oto Servis",    icon: "wrench",     count: 37 },
  ],

  // Unsplash photo IDs (with gradient fallback handled in app.js)
  businesses: [
    {
      id: "elite-barber", name: "Elite Barber", category: "barber", categoryName: "Berber",
      city: "Girne", area: "Karaoğlanoğlu Cd. No:14",
      rating: 4.9, reviews: 312, price: 350, priceLabel: "₺",
      tags: ["Saç Kesimi", "Sakal", "VIP Hizmet"],
      img: "1503951914875-452162b0f3f1",
      gallery: ["1503951914875-452162b0f3f1","1585747860715-2ba37e788b70","1599351431202-1e0f0137899a","1521490878406-8d3d05fd2f33","1605497788044-5a32c7078486"],
      desc: "Girne'nin kalbinde, modern erkek bakımını sanatla buluşturan butik bir berber. Deneyimli ustalarımız, premium ürünler ve rahat bir atmosferle her ziyaretinizi bir deneyime dönüştürüyoruz.",
      featured: true,
      services: [
        { id: "haircut", name: "Saç Kesimi", dur: "30 dk", price: 350, desc: "Yıkama + şekillendirme dahil" },
        { id: "beard", name: "Sakal Tıraşı", dur: "20 dk", price: 200, desc: "Sıcak havlu + bakım" },
        { id: "combo", name: "Saç + Sakal Paketi", dur: "50 dk", price: 500, desc: "En çok tercih edilen", popular: true },
      ],
      hours: ["10:00","10:30","11:00","11:30","12:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"],
      booked: ["11:30","14:00","16:30"],
      open: "Pzt - Cmt · 10:00 - 20:00",
      reviewsList: [
        { name: "Mert A.", date: "3 gün önce", stars: 5, text: "Şehirdeki en iyi berber. Randevu sistemi sayesinde hiç beklemeden hizmet aldım. Kesinlikle tavsiye ederim." },
        { name: "Can Y.", date: "1 hafta önce", stars: 5, text: "Sakal tıraşı muhteşemdi, sıcak havlu detayı çok hoşuma gitti. Ortam çok temiz ve şık." },
        { name: "Deniz K.", date: "2 hafta önce", stars: 4, text: "Usta işini gerçekten biliyor. Tek eleştirim hafta sonu biraz yoğun olması, ama randevu ile sorun kalmıyor." },
      ],
    },
    { id: "the-gentleman", name: "The Gentleman Barber", category: "barber", categoryName: "Berber",
      city: "Lefkoşa", area: "Dereboyu Cd.", rating: 4.7, reviews: 188, price: 300,
      tags: ["Klasik Tıraş","Cilt Bakımı"], img: "1585747860715-2ba37e788b70", featured: true,
      desc: "Klasik berberlik geleneğini modern dokunuşlarla yaşatan bir mekan." },

    { id: "luxe-hair", name: "Luxe Hair Studio", category: "salon", categoryName: "Kuaför",
      city: "Girne", area: "Bekirpaşa", rating: 4.8, reviews: 256, price: 600,
      tags: ["Saç Boyama","Keratin","Topuz"], img: "1560066984-138dadb4c035", featured: true,
      desc: "Saç tasarımında öncü, ödüllü stilistlerle hizmet veren lüks kuaför stüdyosu." },
    { id: "bella-salon", name: "Bella Salon & Spa", category: "salon", categoryName: "Kuaför",
      city: "Gazimağusa", area: "Salamis Yolu", rating: 4.6, reviews: 142, price: 450,
      tags: ["Manikür","Cilt Bakımı"], img: "1521590832167-7bcbfaa6381f",
      desc: "Saç, cilt ve tırnak bakımında bütüncül güzellik deneyimi." },

    { id: "mezze-house", name: "Mezze House", category: "restaurant", categoryName: "Restoran",
      city: "Girne", area: "Eski Liman", rating: 4.9, reviews: 521, price: 850,
      tags: ["Akdeniz","Deniz Manzarası","Şarap"], img: "1517248135467-4c7edcad34c4", featured: true,
      desc: "Girne limanında, taze deniz ürünleri ve geleneksel Kıbrıs mezeleriyle eşsiz bir lezzet yolculuğu." },
    { id: "olive-tree", name: "The Olive Tree", category: "restaurant", categoryName: "Restoran",
      city: "Lefkoşa", area: "Surlariçi", rating: 4.7, reviews: 389, price: 700,
      tags: ["Kıbrıs Mutfağı","Bahçe"], img: "1414235077428-338989a2e8c0",
      desc: "Tarihi Surlariçi'nde otantik Kıbrıs lezzetleri." },

    { id: "arena-pitch", name: "Arena Halı Saha", category: "halisaha", categoryName: "Halı Saha",
      city: "Gazimağusa", area: "Sakarya", rating: 4.8, reviews: 174, price: 1200,
      tags: ["FIFA Çim","Aydınlatma","Duş"], img: "1556056504-5c7696c4c28d", featured: true,
      desc: "Profesyonel ölçülerde, ışıklandırmalı kapalı ve açık sahalar. Online saat rezervasyonu." },
    { id: "goal-club", name: "Goal Club Saha", category: "halisaha", categoryName: "Halı Saha",
      city: "Girne", area: "Çatalköy", rating: 4.5, reviews: 98, price: 1000,
      tags: ["Otopark","Kafeterya"], img: "1431324155629-1a6deb1dec8d",
      desc: "Arkadaşlarınla maç yapmanın en kolay yolu." },

    { id: "happy-paws", name: "Happy Paws Veteriner", category: "vet", categoryName: "Veteriner",
      city: "Lefkoşa", area: "Köşklüçiftlik", rating: 4.9, reviews: 203, price: 500,
      tags: ["7/24 Acil","Aşı","Cerrahi"], img: "1576201836106-db1758fd1c97", featured: true,
      desc: "Dostlarınızın sağlığı için tam donanımlı modern veteriner kliniği." },
    { id: "petcare", name: "PetCare Clinic", category: "vet", categoryName: "Veteriner",
      city: "Girne", area: "Alsancak", rating: 4.7, reviews: 121, price: 450,
      tags: ["Check-up","Tıraş"], img: "1612531385446-f7e6d131e1d0",
      desc: "Sevimli dostlarınız için şefkatli ve uzman bakım." },

    { id: "promax-auto", name: "ProMax Oto Servis", category: "auto", categoryName: "Oto Servis",
      city: "Gazimağusa", area: "Sanayi Bölgesi", rating: 4.8, reviews: 167, price: 900,
      tags: ["Periyodik Bakım","Lastik","Diagnostik"], img: "1530046339160-ce3e530c7d2f", featured: true,
      desc: "Tüm marka araçlar için güvenilir, hızlı ve şeffaf servis hizmeti." },
    { id: "turbo-garage", name: "Turbo Garage", category: "auto", categoryName: "Oto Servis",
      city: "Lefkoşa", area: "Gönyeli", rating: 4.6, reviews: 89, price: 750,
      tags: ["Yağ Değişimi","Kaporta"], img: "1486262715619-67b85e0b08d3",
      desc: "Aracınız emin ellerde. Online randevu ile sıra beklemeyin." },
  ],

  // Dashboard reservations (for Elite Barber owner view)
  reservations: [
    { id: "RZ-2041", customer: "Arda Demir", phone: "+90 533 812 44 11", service: "Saç + Sakal Paketi", date: "12 Haz", time: "15:00", price: 500, status: "pending", when: "Bugün" },
    { id: "RZ-2040", customer: "Kerem Yılmaz", phone: "+90 542 119 87 03", service: "Saç Kesimi", date: "12 Haz", time: "16:30", price: 350, status: "pending", when: "Bugün" },
    { id: "RZ-2039", customer: "Burak Şahin", phone: "+90 533 277 65 90", service: "Sakal Tıraşı", date: "12 Haz", time: "11:30", price: 200, status: "approved", when: "Bugün" },
    { id: "RZ-2038", customer: "Emre Korkmaz", phone: "+90 548 600 32 18", service: "Saç + Sakal Paketi", date: "12 Haz", time: "14:00", price: 500, status: "approved", when: "Bugün" },
    { id: "RZ-2037", customer: "Tolga Aksoy", phone: "+90 533 904 11 76", service: "Saç Kesimi", date: "13 Haz", time: "10:30", price: 350, status: "pending", when: "Yarın" },
    { id: "RZ-2036", customer: "Onur Çelik", phone: "+90 542 388 47 22", service: "Saç Kesimi", date: "11 Haz", time: "17:00", price: 350, status: "completed", when: "Dün" },
    { id: "RZ-2035", customer: "Serkan Demir", phone: "+90 533 745 90 14", service: "Saç + Sakal Paketi", date: "11 Haz", time: "12:00", price: 500, status: "completed", when: "Dün" },
    { id: "RZ-2034", customer: "Mehmet Öz", phone: "+90 548 221 76 55", service: "Sakal Tıraşı", date: "11 Haz", time: "18:30", price: 200, status: "rejected", when: "Dün" },
  ],

  weeklyChart: [
    { d: "Pzt", v: 14 }, { d: "Sal", v: 18 }, { d: "Çar", v: 12 },
    { d: "Per", v: 22 }, { d: "Cum", v: 31 }, { d: "Cmt", v: 38 }, { d: "Paz", v: 9 },
  ],

  testimonials: [
    { name: "Selin Aydın", role: "Müşteri · Girne", initials: "SA", text: "Artık berberime telefon açmıyorum, Rezora'dan saniyeler içinde randevu alıyorum. WhatsApp onayı gelince içim rahat ediyor!" },
    { name: "Hakan Mert", role: "Sahibi · Elite Barber", initials: "HM", text: "Rezora'ya geçtikten sonra no-show oranımız %70 düştü. Panel sayesinde tüm randevuları tek ekrandan yönetiyorum." },
    { name: "Defne Kaya", role: "Sahibi · Luxe Hair Studio", initials: "DK", text: "Müşterilerim online rezervasyonu çok seviyor. Geliriniz net olarak görebildiğim istatistikler işletmem için paha biçilmez." },
  ],
};

REZORA.findBusiness = (id) => REZORA.businesses.find(b => b.id === id) || REZORA.businesses[0];
REZORA.categoryName = (id) => (REZORA.categories.find(c => c.id === id) || {}).name || "";
