import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

async function seedRichData() {
  console.log('🚀 Seeding authentic village festival data into RDS MySQL...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vinayaka_db',
  });

  try {
    const defaultPasswordHash = await bcrypt.hash('Utsav@2026', 10);

    // 1. Seed Users
    const users = [
      {
        id: 'user-super-admin-1',
        name: 'Platform Super Admin',
        phone: '9999999999',
        email: 'admin@utsav.org',
        role: 'SUPER_ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      },
      {
        id: 'user-comm-admin-1',
        name: 'M. Subba Rao',
        phone: '9876543210',
        email: 'subbarao@utsav.org',
        role: 'COMMITTEE_ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      },
      {
        id: 'user-comm-admin-2',
        name: 'K. Srinivasa Varma',
        phone: '9876543211',
        email: 'srinivas@utsav.org',
        role: 'COMMITTEE_ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      },
      {
        id: 'user-devotee-1',
        name: 'V. Lakshmi Devi',
        phone: '9876543212',
        email: 'lakshmi@utsav.org',
        role: 'USER',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      },
      {
        id: 'user-devotee-2',
        name: 'G. Rama Krishna',
        phone: '9876543213',
        email: 'ramakrishna@utsav.org',
        role: 'USER',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200',
      },
      {
        id: 'user-devotee-3',
        name: 'P. Anjaneyulu',
        phone: '9876543214',
        email: 'anjaneyulu@utsav.org',
        role: 'USER',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
      },
    ];

    for (const u of users) {
      await connection.execute(
        `INSERT INTO users (id, name, phone, email, password, role, avatarUrl, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), avatarUrl=VALUES(avatarUrl)`,
        [u.id, u.name, u.phone, u.email, defaultPasswordHash, u.role, u.avatarUrl]
      );
    }
    console.log('✅ Users seeded successfully');

    // 2. Seed Committees
    const committees = [
      {
        id: 'comm-kovvur-101',
        name: 'Sri Rama Youth Committee',
        templeName: 'Sri Seetha Ramachandra Swamy Temple',
        festivalName: 'Sri Rama Navami Utsavam 2026',
        village: 'Kovvur',
        mandal: 'Kovvur',
        district: 'West Godavari',
        state: 'Andhra Pradesh',
        address: 'Main Bazaar Street, Kovvur, West Godavari District',
        latitude: 16.98,
        longitude: 81.72,
        presidentName: 'M. Subba Rao',
        secretaryName: 'K. Srinivasa Varma',
        phone: '9876543210',
        email: 'kovvur.srirama@utsav.org',
        description: 'Organizing grand Sri Rama Navami Utsavams, Annadanam for 5,000 devotees, cultural classical dances, and traditional Rathotsavam procession for over 25 years.',
        logoUrl: 'https://images.unsplash.com/photo-1609743522653-52354461eb27?w=300',
        status: 'APPROVED',
      },
      {
        id: 'comm-rajahmundry-102',
        name: 'Sri Vinayaka Youth Festival Association',
        templeName: 'Siddhi Vinayaka Temple',
        festivalName: 'Ganesh Chaturthi 9-Day Utsavams',
        village: 'Rajahmundry',
        mandal: 'Rajahmundry Urban',
        district: 'East Godavari',
        state: 'Andhra Pradesh',
        address: 'Godavari Bund Road, Rajahmundry',
        latitude: 17.00,
        longitude: 81.78,
        presidentName: 'G. Rama Krishna',
        secretaryName: 'Ch. Venkateswara Rao',
        phone: '9876543213',
        email: 'rajahmundry.vinayaka@utsav.org',
        description: 'Celebrated 21ft eco-friendly Vinayaka Idol installation, daily Laddu Pooja, devotional music concerts, and majestic Godavari River Nimajjanam procession.',
        logoUrl: 'https://images.unsplash.com/photo-1567591377030-de198b9d5186?w=300',
        status: 'APPROVED',
      },
      {
        id: 'comm-tanuku-103',
        name: 'Sri Hanuman Youth Sangham',
        templeName: 'Abhaya Anjaneya Swamy Temple',
        festivalName: 'Hanuman Jayanti Mahotsavam',
        village: 'Tanuku',
        mandal: 'Tanuku',
        district: 'West Godavari',
        state: 'Andhra Pradesh',
        address: 'NTR Circle, Tanuku',
        latitude: 16.86,
        longitude: 81.70,
        presidentName: 'P. Anjaneyulu',
        secretaryName: 'B. Narasimha Rao',
        phone: '9876543214',
        email: 'tanuku.hanuman@utsav.org',
        description: 'Annual Hanuman Jayanti 41-day Deeksha Viramana, 108 Kilo Laddu distribution, and massive Akhanda Hanuman Chalisa Parayanam.',
        logoUrl: 'https://images.unsplash.com/photo-1621600411688-4be93cd68504?w=300',
        status: 'APPROVED',
      },
      {
        id: 'comm-vijayawada-104',
        name: 'Sri Durga Malleswara Utsava Samithi',
        templeName: 'Kanaka Durga Temple',
        festivalName: 'Vijayawada Dasara Navaratri 2026',
        village: 'Vijayawada',
        mandal: 'Vijayawada Urban',
        district: 'NTR District',
        state: 'Andhra Pradesh',
        address: 'Indrakeeladri Hill Road, Vijayawada',
        latitude: 16.51,
        longitude: 80.61,
        presidentName: 'T. Rajesh Kumar',
        secretaryName: 'S. Nageswara Rao',
        phone: '9876543215',
        email: 'vijayawada.durga@utsav.org',
        description: 'Grand Dasara Celebrations, daily Goddess Alankaram, Hamsa Vahanam Teppotsavam in Krishna River, and spiritual Kumkumarchana for thousands of pilgrims.',
        logoUrl: 'https://images.unsplash.com/photo-1590077428593-a55bb07c4665?w=300',
        status: 'PENDING',
      },
    ];

    for (const c of committees) {
      await connection.execute(
        `INSERT INTO committees (id, name, templeName, festivalName, village, mandal, district, state, address, latitude, longitude, presidentName, secretaryName, phone, email, description, logoUrl, status, approvedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), logoUrl=VALUES(logoUrl), status=VALUES(status)`,
        [c.id, c.name, c.templeName, c.festivalName, c.village, c.mandal, c.district, c.state, c.address, c.latitude, c.longitude, c.presidentName, c.secretaryName, c.phone, c.email, c.description, c.logoUrl, c.status]
      );
    }
    console.log('✅ Committees seeded successfully');

    // 3. Seed Committee Members
    const members = [
      { id: 'cm-1', userId: 'user-comm-admin-1', committeeId: 'comm-kovvur-101', role: 'ADMIN' },
      { id: 'cm-2', userId: 'user-comm-admin-2', committeeId: 'comm-kovvur-101', role: 'MEMBER' },
      { id: 'cm-3', userId: 'user-devotee-2', committeeId: 'comm-rajahmundry-102', role: 'ADMIN' },
      { id: 'cm-4', userId: 'user-devotee-3', committeeId: 'comm-tanuku-103', role: 'ADMIN' },
    ];
    for (const m of members) {
      await connection.execute(
        `INSERT INTO committee_members (id, userId, committeeId, role, isActive)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE role=VALUES(role)`,
        [m.id, m.userId, m.committeeId, m.role]
      );
    }

    // 4. Seed Events
    const events = [
      {
        id: 'event-rama-1',
        committeeId: 'comm-kovvur-101',
        name: 'Sri Rama Navami Sitarama Kalyana Mahotsavam',
        festival: 'Sri Rama Navami',
        description: 'Grand Celestial Wedding Ceremony of Lord Sri Rama & Sita Devi followed by Maha Annadanam for 5,000 devotees and evening Carnatic Musical Concert.',
        venue: 'Sri Seetha Ramachandra Swamy Temple Grounds, Kovvur',
        date: '2026-04-12 09:00:00',
        guest: 'H.H. Sri Tridandi Chinna Jeeyar Swamiji (Special Blessings)',
        budget: 350000,
        organizer: 'Sri Rama Youth Committee',
        status: 'UPCOMING',
        bannerUrl: 'https://images.unsplash.com/photo-1609743522653-52354461eb27?w=800',
      },
      {
        id: 'event-rama-2',
        committeeId: 'comm-kovvur-101',
        name: 'Grand Sri Rama Rathotsavam (Chariot Procession)',
        festival: 'Sri Rama Navami',
        description: 'Traditional 35ft Wooden Chariot procession carrying Sri Rama, Sita, Lakshmana, and Anjaneya deities across all main streets of Kovvur village.',
        venue: 'Village Main Road to Godavari Ghat',
        date: '2026-04-13 17:00:00',
        guest: 'District Collector & Local VIPs',
        budget: 180000,
        organizer: 'Youth Chariot Committee',
        status: 'UPCOMING',
        bannerUrl: 'https://images.unsplash.com/photo-1567591377030-de198b9d5186?w=800',
      },
      {
        id: 'event-vinayaka-1',
        committeeId: 'comm-rajahmundry-102',
        name: 'Siddhi Vinayaka Laddu Auction & Nimajjanam',
        festival: 'Ganesh Chaturthi',
        description: 'Annual 21 Kilo Sacred Laddu Auction ceremony followed by grand musical procession and Godavari River Nimajjanam with fireworks display.',
        venue: 'Godavari Ghat Pushkar Ghat, Rajahmundry',
        date: '2026-09-24 16:00:00',
        guest: 'Rajahmundry City Mayor & MLA',
        budget: 250000,
        organizer: 'Sri Vinayaka Association',
        status: 'UPCOMING',
        bannerUrl: 'https://images.unsplash.com/photo-1621600411688-4be93cd68504?w=800',
      },
    ];

    for (const e of events) {
      await connection.execute(
        `INSERT INTO events (id, committeeId, name, festival, description, venue, date, guest, budget, organizer, status, bannerUrl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), bannerUrl=VALUES(bannerUrl)`,
        [e.id, e.committeeId, e.name, e.festival, e.description, e.venue, e.date, e.guest, e.budget, e.organizer, e.status, e.bannerUrl]
      );
    }
    console.log('✅ Events seeded successfully');

    // 5. Seed Donations
    const donations = [
      {
        id: 'don-101',
        committeeId: 'comm-kovvur-101',
        eventId: 'event-rama-1',
        addedById: 'user-comm-admin-1',
        donorName: 'M. Subba Rao & Family',
        donorPhone: '9876543210',
        donorAddress: 'Kovvur Main Road',
        amount: 51000,
        purpose: 'Maha Annadanam Sponsorship',
        paymentMethod: 'UPI',
        receiptNo: 'REC-2026-001',
      },
      {
        id: 'don-102',
        committeeId: 'comm-kovvur-101',
        eventId: 'event-rama-1',
        addedById: 'user-comm-admin-1',
        donorName: 'V. Lakshmi Devi',
        donorPhone: '9876543212',
        donorAddress: 'Godavari Street, Kovvur',
        amount: 25000,
        purpose: 'Flower Decoration & Kalyana Mandapam',
        paymentMethod: 'CASH',
        receiptNo: 'REC-2026-002',
      },
      {
        id: 'don-103',
        committeeId: 'comm-kovvur-101',
        eventId: 'event-rama-2',
        addedById: 'user-comm-admin-1',
        donorName: 'K. Srinivasa Varma',
        donorPhone: '9876543211',
        donorAddress: 'Kovvur Village',
        amount: 15000,
        purpose: 'Rathotsavam Lighting & Chariot Flower Garland',
        paymentMethod: 'UPI',
        receiptNo: 'REC-2026-003',
      },
      {
        id: 'don-104',
        committeeId: 'comm-rajahmundry-102',
        eventId: 'event-vinayaka-1',
        addedById: 'user-comm-admin-1',
        donorName: 'G. Rama Krishna',
        donorPhone: '9876543213',
        donorAddress: 'Rajahmundry',
        amount: 31000,
        purpose: 'Ganesh Laddu Sponsorship',
        paymentMethod: 'UPI',
        receiptNo: 'REC-2026-004',
      },
      {
        id: 'don-105',
        committeeId: 'comm-tanuku-103',
        addedById: 'user-comm-admin-1',
        donorName: 'P. Anjaneyulu',
        donorPhone: '9876543214',
        donorAddress: 'Tanuku',
        amount: 21000,
        purpose: 'Hanuman Chalisa Books & Prasadam',
        paymentMethod: 'CASH',
        receiptNo: 'REC-2026-005',
      },
    ];

    for (const d of donations) {
      await connection.execute(
        `INSERT INTO donations (id, committeeId, eventId, addedById, donorName, donorPhone, donorAddress, amount, purpose, paymentMethod, receiptNo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE amount=VALUES(amount), purpose=VALUES(purpose)`,
        [d.id, d.committeeId, d.eventId || null, d.addedById, d.donorName, d.donorPhone, d.donorAddress, d.amount, d.purpose, d.paymentMethod, d.receiptNo]
      );
    }
    console.log('✅ Donations seeded successfully');

    // 6. Seed Expenses
    const expenses = [
      {
        id: 'exp-101',
        committeeId: 'comm-kovvur-101',
        addedById: 'user-comm-admin-1',
        category: 'FOOD',
        vendor: 'Vijaya Catering & Annadanam Services',
        amount: 42000,
        description: 'Rice, Sambar, Sweet, Curd, & Paper Plates for 5,000 Devotees Annadanam',
      },
      {
        id: 'exp-102',
        committeeId: 'comm-kovvur-101',
        addedById: 'user-comm-admin-1',
        category: 'LIGHTING',
        vendor: 'Sri Lakshmi Electricals & Sound System',
        amount: 28000,
        description: 'LED Arch Lights, Temple Tower Illumination, and Generator Backup',
      },
      {
        id: 'exp-103',
        committeeId: 'comm-kovvur-101',
        addedById: 'user-comm-admin-1',
        category: 'FLOWERS',
        vendor: 'Srinivas Flower Decorators (Kadiyam)',
        amount: 18500,
        description: 'Jasmine, Rose, and Marigold Garlands for Deity Kalyanam & Chariot',
      },
      {
        id: 'exp-104',
        committeeId: 'comm-rajahmundry-102',
        addedById: 'user-comm-admin-1',
        category: 'RENTAL',
        vendor: 'Rao Brothers Tent House & Stage Setup',
        amount: 35000,
        description: 'Waterproof German Hanger Pandal & Raised Stage for Cultural Dances',
      },
    ];

    for (const ex of expenses) {
      await connection.execute(
        `INSERT INTO expenses (id, committeeId, addedById, category, vendor, amount, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE amount=VALUES(amount), description=VALUES(description)`,
        [ex.id, ex.committeeId, ex.addedById, ex.category, ex.vendor, ex.amount, ex.description]
      );
    }
    console.log('✅ Expenses seeded successfully');

    // 7. Seed Reels
    const reels = [
      {
        id: 'reel-101',
        committeeId: 'comm-kovvur-101',
        eventId: 'event-rama-1',
        uploadedById: 'user-comm-admin-1',
        videoS3Key: 'reels/sri-rama-procession.mp4',
        videoS3Url: 'https://assets.mixkit.co/videos/preview/mixkit-temple-procession-festival-41586-large.mp4',
        thumbnailS3Url: 'https://images.unsplash.com/photo-1609743522653-52354461eb27?w=600',
        caption: 'Sri Seetha Rama Kalyana Utsavam Grand Temple Procession in Kovvur! 🛕✨ Jai Sri Ram! 🙏',
        location: 'Kovvur Village Temple',
        hashtags: '#SriRamaNavami #Kovvur #Utsav2026 #JaiSriRam',
        status: 'PUBLISHED',
        viewCount: 1420,
        likeCount: 385,
        commentCount: 42,
        duration: 30,
      },
      {
        id: 'reel-102',
        committeeId: 'comm-rajahmundry-102',
        eventId: 'event-vinayaka-1',
        uploadedById: 'user-comm-admin-1',
        videoS3Key: 'reels/vinayaka-nimajjanam.mp4',
        videoS3Url: 'https://assets.mixkit.co/videos/preview/mixkit-people-celebrating-with-fireworks-at-night-41585-large.mp4',
        thumbnailS3Url: 'https://images.unsplash.com/photo-1567591377030-de198b9d5186?w=600',
        caption: 'Majestic Godavari River Vinayaka Nimajjanam & Dhol Tasha Procession! 🥁🔥 Ganpati Bappa Morya!',
        location: 'Rajahmundry Godavari Ghat',
        hashtags: '#GaneshChaturthi #GodavariNimajjanam #Rajahmundry #Utsav2026',
        status: 'PUBLISHED',
        viewCount: 2890,
        likeCount: 712,
        commentCount: 89,
        duration: 45,
      },
      {
        id: 'reel-103',
        committeeId: 'comm-tanuku-103',
        eventId: null,
        uploadedById: 'user-comm-admin-1',
        videoS3Key: 'reels/hanuman-chalisa.mp4',
        videoS3Url: 'https://assets.mixkit.co/videos/preview/mixkit-lighting-candles-in-a-temple-41584-large.mp4',
        thumbnailS3Url: 'https://images.unsplash.com/photo-1621600411688-4be93cd68504?w=600',
        caption: 'Akhanda 108 Hanuman Chalisa Parayanam & Deepotsavam at Abhaya Anjaneya Swamy Temple 🛕🔥',
        location: 'Tanuku NTR Circle',
        hashtags: '#HanumanJayanti #AbhayaAnjaneya #Tanuku #Devotion',
        status: 'PUBLISHED',
        viewCount: 980,
        likeCount: 245,
        commentCount: 18,
        duration: 25,
      },
    ];

    for (const r of reels) {
      await connection.execute(
        `INSERT INTO reels (id, committeeId, eventId, uploadedById, videoS3Key, videoS3Url, thumbnailS3Url, caption, location, hashtags, status, viewCount, likeCount, commentCount, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE caption=VALUES(caption), viewCount=VALUES(viewCount), likeCount=VALUES(likeCount), commentCount=VALUES(commentCount)`,
        [r.id, r.committeeId, r.eventId || null, r.uploadedById, r.videoS3Key, r.videoS3Url, r.thumbnailS3Url, r.caption, r.location, r.hashtags, r.status, r.viewCount, r.likeCount, r.commentCount, r.duration]
      );
    }
    console.log('✅ Reels seeded successfully');

    // 8. Seed Comments
    const comments = [
      {
        id: 'comm-text-1',
        reelId: 'reel-101',
        userId: 'user-devotee-1',
        content: 'Jai Sri Ram! 🙏 Extremely well-organized festival procession by Kovvur youth committee!',
      },
      {
        id: 'comm-text-2',
        reelId: 'reel-101',
        userId: 'user-devotee-2',
        content: 'Har Har Mahadev! Prasadam Annadanam timing and menu standard is awesome! 👌',
      },
      {
        id: 'comm-text-3',
        reelId: 'reel-102',
        userId: 'user-devotee-3',
        content: 'Ganpati Bappa Morya! 🥁 Fireworks display at Pushkar Ghat was spectacular!',
      },
    ];

    for (const cm of comments) {
      await connection.execute(
        `INSERT INTO reel_comments (id, reelId, userId, content)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content=VALUES(content)`,
        [cm.id, cm.reelId, cm.userId, cm.content]
      );
    }
    console.log('✅ Reel comments seeded successfully');

    console.log('🎉 RICH FESTIVAL DATA SEEDING COMPLETE!');
  } catch (err: any) {
    console.error('❌ Error seeding rich data:', err);
  } finally {
    await connection.end();
  }
}

seedRichData();
