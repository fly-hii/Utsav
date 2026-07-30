import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function cleanOldTables() {
  const dbName = process.env.DB_NAME || 'vinayaka_db';
  console.log(`🧹 Cleaning up old project tables and foreign keys in database '${dbName}'...`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
  });

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    const oldTables = [
      'colonies',
      'committee_analytics_daily',
      'committee_follows',
      'districts',
      'emergency_contacts',
      'event_reminders',
      'feed_post_media',
      'feed_post_tags',
      'feed_posts',
      'ledger_entries',
      'otp_requests',
      'post_comments',
      'post_likes',
      'states',
      'stories',
      'user_notification_preferences',
      'villages',
      'refresh_tokens',
      'notifications',
      'gallery',
      'reel_views',
      'reel_shares',
      'reel_comments',
      'reel_likes',
      'reels',
      'expenses',
      'donations',
      'events',
      'committee_members',
      'committee_documents',
      'committees',
      'users',
    ];

    for (const table of oldTables) {
      await connection.query(`DROP TABLE IF EXISTS \`${table}\`;`);
      console.log(`  Dropped table if existed: ${table}`);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ Old tables cleaned up successfully!');
  } catch (err: any) {
    console.error('❌ Error cleaning old tables:', err.message);
  } finally {
    await connection.end();
  }
}

cleanOldTables();
