const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");

const mongoose = require("mongoose");
const dotenv   = require("dotenv");

dotenv.config();

const User = require("./models/User");
const Crop = require("./models/Crop");

const DEMO_CROPS = [
  { name: "Fresh Tomatoes",      category: "vegetables", price: 28,  quantity: 500, unit: "kg",     location: "Nashik, Maharashtra",   description: "Grade A red tomatoes, freshly harvested. Ideal for cooking and salads.",   image: { url: "https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400" } },
  { name: "Basmati Rice",        category: "grains",     price: 85,  quantity: 200, unit: "kg",     location: "Karnal, Haryana",        description: "Premium long-grain Basmati rice with natural aroma. 1121 variety.",         image: { url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400" } },
  { name: "Organic Spinach",     category: "vegetables", price: 40,  quantity: 80,  unit: "kg",     location: "Pune, Maharashtra",      description: "Certified organic spinach, pesticide-free. Rich in iron and vitamins.",    image: { url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400" } },
  { name: "Alphonso Mangoes",    category: "fruits",     price: 200, quantity: 50,  unit: "kg",     location: "Ratnagiri, Maharashtra", description: "King of mangoes — GI-tagged Ratnagiri Alphonso. Sweet & aromatic.",        image: { url: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400" } },
  { name: "Red Onions",          category: "vegetables", price: 22,  quantity: 800, unit: "kg",     location: "Nashik, Maharashtra",    description: "Medium-sized red onions with strong flavor. Bulk wholesale available.",   image: { url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400" } },
  { name: "Wheat (Gehun)",       category: "grains",     price: 30,  quantity: 10,  unit: "quintal",location: "Ludhiana, Punjab",        description: "HD-2967 wheat variety. Low moisture, high protein content.",              image: { url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400" } },
  { name: "Turmeric (Haldi)",    category: "spices",     price: 180, quantity: 60,  unit: "kg",     location: "Erode, Tamil Nadu",      description: "Salem turmeric with 3.5% curcumin content. Polished finger variety.",     image: { url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400" } },
  { name: "Green Bananas",       category: "fruits",     price: 35,  quantity: 120, unit: "kg",     location: "Jalgaon, Maharashtra",   description: "G9 Cavendish bananas, slightly green. Great shelf life for transport.",   image: { url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400" } },
  { name: "Potatoes",            category: "vegetables", price: 20,  quantity: 5,   unit: "quintal",location: "Agra, Uttar Pradesh",     description: "Kufri Jyoti variety. Clean, well-graded. Ideal for chips and curries.",   image: { url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400" } },
  { name: "Green Chillies",      category: "spices",     price: 60,  quantity: 40,  unit: "kg",     location: "Guntur, Andhra Pradesh", description: "Jwala variety green chillies. Medium spice level, thin-walled.",          image: { url: "https://images.unsplash.com/photo-1588167056547-c183313da4ef?w=400" } },
  { name: "Coriander Seeds",     category: "spices",     price: 90,  quantity: 30,  unit: "kg",     location: "Rajkot, Gujarat",        description: "Scooter variety coriander. High volatile oil content, bold seeds.",       image: { url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" } },
  { name: "Sugarcane",           category: "other",      price: 350, quantity: 2,   unit: "ton",    location: "Kolhapur, Maharashtra",  description: "Co-86032 variety sugarcane. 10-11% sucrose content. Fresh cut.",          image: { url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" } },
  { name: "Black Pepper",        category: "spices",     price: 450, quantity: 20,  unit: "kg",     location: "Wayanad, Kerala",        description: "Panniyur-1 black pepper. Bold berries, 6% piperine. Sun-dried.",         image: { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400" } },
  { name: "Pomegranate",         category: "fruits",     price: 120, quantity: 70,  unit: "kg",     location: "Solapur, Maharashtra",   description: "Bhagwa pomegranate — large, deep red arils. Export quality.",            image: { url: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400" } },
  { name: "Okra (Bhindi)",       category: "vegetables", price: 45,  quantity: 60,  unit: "kg",     location: "Surat, Gujarat",         description: "Parbhani Kranti variety. Tender 8-10 cm pods, harvested daily.",         image: { url: "https://images.unsplash.com/photo-1627735557303-6dfe7b9bc76b?w=400" } },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find or create a demo farmer account
    let farmer = await User.findOne({ email: "demofarm@agroconnect.com" });

    if (!farmer) {
      farmer = await User.create({
        name:             "Demo Farmer",
        email:            "demofarm@agroconnect.com",
        role:             "farmer",
        phone:            "9000000001",
        isEmailVerified:  true,
        profileCompleted: true,
      });
      console.log("✅ Created demo farmer:", farmer._id);
    } else {
      console.log("ℹ️  Using existing demo farmer:", farmer._id);
    }

    // Remove old demo crops from this farmer (clean re-seed)
    const deleted = await Crop.deleteMany({ farmer: farmer._id });
    console.log(`🗑  Removed ${deleted.deletedCount} old demo crops`);

    // Insert new demo crops
    const crops = DEMO_CROPS.map(c => ({
      ...c,
      farmer: farmer._id,
      status: "listed",
      sowingDate:  new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      harvestDate: new Date(Date.now() - 5  * 24 * 60 * 60 * 1000),
    }));

    const inserted = await Crop.insertMany(crops);
    console.log(`✅ Inserted ${inserted.length} demo products!\n`);

    inserted.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} — ₹${c.price}/${c.unit} (${c.location})`);
    });

    console.log("\n🎉 Seed complete! Open Browse page to see products.");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
