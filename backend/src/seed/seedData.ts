import { connectDB, isDbConnected } from '../config/db.js';
import { User } from '../models/User.js';
import { Contact } from '../models/Contact.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { AutoReplyRule } from '../models/AutoReplyRule.js';
import { Faq } from '../models/Faq.js';
import { BotSettings } from '../models/BotSettings.js';
import { MessageTemplate } from '../models/MessageTemplate.js';
import { Campaign } from '../models/Campaign.js';
import { ApiConfig } from '../models/ApiConfig.js';
import { BusinessConfiguration } from '../models/BusinessConfiguration.js';
import { CatalogItem } from '../models/CatalogItem.js';
import { Booking } from '../models/Booking.js';
import { Order } from '../models/Order.js';
import { ConversationSession } from '../models/ConversationSession.js';
import { initialStoreData } from '../services/store.js';

export const seedDatabase = async (force = false) => {
  try {
    if (!isDbConnected) {
      console.log('[Seed] DB is not connected, using in-memory store.');
      return;
    }

    if (force) {
      console.log('[Seed] Force resetting all collections in MongoDB...');
      await User.deleteMany({});
      await Contact.deleteMany({});
      await Conversation.deleteMany({});
      await Message.deleteMany({});
      await AutoReplyRule.deleteMany({});
      await Faq.deleteMany({});
      await BotSettings.deleteMany({});
      await MessageTemplate.deleteMany({});
      await Campaign.deleteMany({});
      await ApiConfig.deleteMany({});
      await BusinessConfiguration.deleteMany({});
      await CatalogItem.deleteMany({});
      await Booking.deleteMany({});
      await Order.deleteMany({});
      await ConversationSession.deleteMany({});
    }

    const contactCount = await Contact.countDocuments();
    if (contactCount === 0 || force) {
      console.log('[Seed] Inserting initial sample data into MongoDB...');
      const userCount = await User.countDocuments();
      if (userCount === 0) await User.insertMany(initialStoreData.users);

      await Contact.insertMany(initialStoreData.contacts);
      await Conversation.insertMany(initialStoreData.conversations);
      await Message.insertMany(initialStoreData.messages);

      const rulesCount = await AutoReplyRule.countDocuments();
      if (rulesCount === 0) await AutoReplyRule.insertMany(initialStoreData.autoReplyRules);

      const faqsCount = await Faq.countDocuments();
      if (faqsCount === 0) await Faq.insertMany(initialStoreData.faqs);

      const botCount = await BotSettings.countDocuments();
      if (botCount === 0) await BotSettings.create(initialStoreData.botSettings);

      const tmplCount = await MessageTemplate.countDocuments();
      if (tmplCount === 0) await MessageTemplate.insertMany(initialStoreData.templates);

      const campCount = await Campaign.countDocuments();
      if (campCount === 0) await Campaign.insertMany(initialStoreData.campaigns);

      const apiCount = await ApiConfig.countDocuments();
      if (apiCount === 0) await ApiConfig.create(initialStoreData.apiConfig);

      const bizCount = await BusinessConfiguration.countDocuments();
      if (bizCount === 0) await BusinessConfiguration.create(initialStoreData.businessConfig);

      const catCount = await CatalogItem.countDocuments();
      if (catCount === 0) await CatalogItem.insertMany(initialStoreData.catalogItems);

      const bkCount = await Booking.countDocuments();
      if (bkCount === 0) await Booking.insertMany(initialStoreData.bookings);

      const ordCount = await Order.countDocuments();
      if (ordCount === 0) await Order.insertMany(initialStoreData.orders);

      console.log('[Seed] MongoDB successfully populated with Business Configuration, Catalog, and Bookings!');
    } else {
      // Check if catalog is missing
      const catCount = await CatalogItem.countDocuments();
      if (catCount === 0) {
        console.log('[Seed] Seeding catalog and business config into existing DB...');
        await BusinessConfiguration.create(initialStoreData.businessConfig);
        await CatalogItem.insertMany(initialStoreData.catalogItems);
        await Booking.insertMany(initialStoreData.bookings);
        await Order.insertMany(initialStoreData.orders);
      }
      console.log(`[Seed] MongoDB ready with contacts and catalog.`);
    }
  } catch (error: any) {
    console.error('[Seed] Error seeding database:', error.message);
  }
};

// Allow running directly via CLI
if (process.argv[1]?.includes('seedData')) {
  (async () => {
    await connectDB();
    await seedDatabase(true);
    process.exit(0);
  })();
}
