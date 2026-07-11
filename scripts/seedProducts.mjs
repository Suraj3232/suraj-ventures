/**
 * ============================================================
 * Suraj Ventures — One-Time Product Seed Script
 * ============================================================
 *
 * PURPOSE:
 *   Migrate all 25 products from src/data/products.js into
 *   Firestore's "products" collection so the website can use
 *   Firestore as the single source of truth.
 *
 * HOW TO RUN:
 *   node scripts/seedProducts.mjs
 *
 * REQUIREMENTS:
 *   - Node.js v18 or later
 *   - The .env.local file must exist in the project root
 *   - Run from the project root directory
 *
 * SAFETY:
 *   - The script checks for duplicate slugs before inserting.
 *   - Re-running will skip products that already exist.
 *   - Products are seeded with status: 'active' so they appear
 *     on the public website immediately.
 * ============================================================
 */

import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Load .env.local ───────────────────────────────────────────────────────

function loadEnv(filepath = '.env.local') {
  try {
    const raw = readFileSync(filepath, 'utf-8');
    return Object.fromEntries(
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const eqIdx = line.indexOf('=');
          return [line.slice(0, eqIdx).trim(), line.slice(eqIdx + 1).trim()];
        })
    );
  } catch (err) {
    console.error('❌  Could not read .env.local:', err.message);
    process.exit(1);
  }
}

const env = loadEnv();

// ─── Firebase init ─────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─── Slug Helper ───────────────────────────────────────────────────────────

const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ─── Static products data (copied from src/data/products.js) ──────────────

const products = [
  { id: "prod001", productName: "Herbal Face Wash", category: "Cosmetics & Personal Care", ingredients: ["Neem", "Aloe Vera", "Turmeric"], features: ["Paraben Free", "Cruelty Free", "Sulfate Free"], benefits: ["Acne Care", "Hydration", "Skin Care"], description: "Gentle face wash with herbal extracts to cleanse and soothe skin. Perfect for all skin types.", usageInstructions: "Apply on wet face, massage gently, then rinse thoroughly with water." },
  { id: "prod002", productName: "Aloe Vera Shampoo", category: "Cosmetics & Personal Care", ingredients: ["Aloe Vera", "Mint", "Tea Tree"], features: ["Sulfate Free", "Silicone Free", "Vegan"], benefits: ["Hair Nutrition", "Anti-Dandruff", "Hair Care"], description: "Natural shampoo enriched with aloe vera and mint for healthy, shiny hair.", usageInstructions: "Wet hair, apply shampoo, massage scalp, rinse with water." },
  { id: "prod003", productName: "Lavender Body Lotion", category: "Cosmetics & Personal Care", ingredients: ["Lavender", "Shea Butter", "Vitamin E"], features: ["Paraben Free", "Cruelty Free", "Organic"], benefits: ["Skin Soothing", "Hydration", "Relaxation"], description: "Luxurious body lotion with lavender essential oil for soft, moisturized skin.", usageInstructions: "Apply to clean skin and massage gently until absorbed." },
  { id: "prod004", productName: "Tulsi Neem Soap Bar", category: "Cosmetics & Personal Care", ingredients: ["Tulsi", "Neem", "Coconut Oil"], features: ["Sulfate Free", "Natural Oils", "Vegan"], benefits: ["Clear Skin", "Antibacterial", "Skin Care"], description: "Traditional soap bar with tulsi and neem for clear, healthy skin.", usageInstructions: "Wet skin, apply soap, create lather, rinse with water." },
  { id: "prod005", productName: "Argan Oil Hair Serum", category: "Cosmetics & Personal Care", ingredients: ["Argan Oil", "Jojoba Oil", "Vitamin C"], features: ["Alcohol Free", "Light Scent", "Vegan"], benefits: ["Frizz Control", "Shine", "Hair Care"], description: "Premium hair serum for smooth, shiny, frizz-free hair.", usageInstructions: "Apply 2-3 drops to damp hair before drying." },
  { id: "prod006", productName: "Organic Multigrain Bread", category: "Food Products", ingredients: ["Whole Wheat", "Oats", "Flaxseeds"], features: ["Whole Grain", "No Added Sugar", "Organic"], benefits: ["Digestive Health", "Energy", "Weight Management"], description: "Nutritious bread made from organic whole grains and seeds.", usageInstructions: "Store in cool, dry place. Best consumed within 3-4 days." },
  { id: "prod007", productName: "Turmeric Almond Snack Bar", category: "Food Products", ingredients: ["Almonds", "Turmeric", "Honey"], features: ["Gluten Free", "Vegan", "No Artificial Colors"], benefits: ["Anti-Inflammatory", "Energy", "Weight Management"], description: "Healthy snack bar with anti-inflammatory turmeric and almonds.", usageInstructions: "Enjoy as a quick snack anytime." },
  { id: "prod008", productName: "Green Detox Tea", category: "Food Products", ingredients: ["Green Tea", "Ginger", "Lemongrass"], features: ["Caffeine Free", "Organic", "No Sugar"], benefits: ["Metabolism", "Detox", "Digestive Health"], description: "Refreshing herbal tea blend for detoxification and wellness.", usageInstructions: "Steep 1 tea bag in hot water for 3-5 minutes." },
  { id: "prod009", productName: "Moringa Herbal Powder", category: "Food Products", ingredients: ["Moringa", "Spirulina", "Barley Grass"], features: ["Organic", "Vegan", "No Added Sugar"], benefits: ["Nutrition Boost", "Immunity", "Energy"], description: "Superfood powder packed with nutrients for overall wellness.", usageInstructions: "Mix 1 teaspoon with water or juice daily." },
  { id: "prod010", productName: "Probiotic Greek Yogurt", category: "Food Products", ingredients: ["Milk", "Live Cultures", "Honey"], features: ["High Protein", "No Preservatives", "Natural"], benefits: ["Gut Health", "Bone Support", "Digestive Health"], description: "Rich, creamy yogurt with live probiotic cultures.", usageInstructions: "Enjoy directly from container or add to smoothies." },
  { id: "prod011", productName: "Whey Protein Isolate", category: "Nutrition & Wellness", ingredients: ["Whey Protein", "Stevia", "Natural Flavors"], features: ["Low Carb", "No Artificial Colors", "Vegan"], benefits: ["Muscle Growth", "Recovery", "Energy"], description: "Pure whey protein for muscle building and recovery.", usageInstructions: "Mix 1 scoop with water or milk daily." },
  { id: "prod012", productName: "Ashwagandha Immune Capsules", category: "Nutrition & Wellness", ingredients: ["Ashwagandha", "Vitamin C", "Zinc"], features: ["Vegan", "Non-GMO", "Gluten Free"], benefits: ["Immunity Support", "Stress Relief", "Energy"], description: "Adaptogenic herb to boost immunity and reduce stress.", usageInstructions: "Take 1 capsule daily with water." },
  { id: "prod013", productName: "Omega-3 Flaxseed Oil", category: "Nutrition & Wellness", ingredients: ["Flaxseed Oil", "Omega-3", "Vitamin E"], features: ["Vegan", "Gluten Free", "Cold Pressed"], benefits: ["Heart Health", "Brain Function", "Immunity"], description: "Pure omega-3 rich flaxseed oil for heart and brain health.", usageInstructions: "Take 1 tablespoon daily with meals." },
  { id: "prod014", productName: "Super Greens Powder", category: "Nutrition & Wellness", ingredients: ["Kale", "Spinach", "Alfalfa"], features: ["Organic", "Vegan", "No Sugar"], benefits: ["Detox", "Energy", "Nutrition Boost"], description: "Complete greens powder for daily nutrition.", usageInstructions: "Mix 1 scoop in water or smoothie daily." },
  { id: "prod015", productName: "Vitamin B Complex", category: "Nutrition & Wellness", ingredients: ["B1", "B2", "B3", "B6", "B12"], features: ["GMO Free", "Vegetarian", "Gluten Free"], benefits: ["Energy", "Metabolism", "Brain Health"], description: "Complete B-vitamin complex for energy and metabolism.", usageInstructions: "Take 1 tablet daily with food." },
  { id: "prod016", productName: "Herbal Sleep Aid", category: "Health & Wellness", ingredients: ["Chamomile", "Valerian Root", "Passionflower"], features: ["Non Habit Forming", "Non-GMO", "Vegan"], benefits: ["Sleep Improvement", "Calm", "Relaxation"], description: "Natural herbal blend to promote better sleep.", usageInstructions: "Take 1-2 capsules 30 minutes before bed." },
  { id: "prod017", productName: "Digestive Enzymes", category: "Health & Wellness", ingredients: ["Bromelain", "Papain", "Ginger"], features: ["Gluten Free", "Non-GMO", "Vegan"], benefits: ["Digestion", "Bloating Relief", "Digestive Health"], description: "Natural enzymes to support healthy digestion.", usageInstructions: "Take 1 capsule with each meal." },
  { id: "prod018", productName: "Immunity Booster Syrup", category: "Health & Wellness", ingredients: ["Tulsi", "Honey", "Lemon"], features: ["Sugar Free", "Natural", "Organic"], benefits: ["Cold Relief", "Immunity", "Cough Support"], description: "Traditional immunity boosting syrup.", usageInstructions: "Take 1 tablespoon twice daily." },
  { id: "prod019", productName: "Calcium Magnesium Tablets", category: "Health & Wellness", ingredients: ["Calcium", "Magnesium", "Vitamin D"], features: ["Vegetarian", "GMO Free", "Gluten Free"], benefits: ["Bone Health", "Muscle Function", "Immunity"], description: "Essential minerals for bone and muscle health.", usageInstructions: "Take 1 tablet daily with food." },
  { id: "prod020", productName: "Stress Relief Herbal Tea", category: "Health & Wellness", ingredients: ["Lemon Balm", "Lavender", "Mint"], features: ["Caffeine Free", "Organic", "Natural"], benefits: ["Relaxation", "Mental Wellness", "Calm"], description: "Calming herbal tea for stress relief.", usageInstructions: "Steep 1 tea bag in hot water for 5 minutes." },
  { id: "prod021", productName: "Neem Turmeric Face Mask", category: "Cosmetics & Personal Care", ingredients: ["Neem", "Turmeric", "Honey"], features: ["Paraben Free", "Natural", "Organic"], benefits: ["Skin Care", "Acne Care", "Brightening"], description: "Detoxifying face mask for clear, glowing skin.", usageInstructions: "Apply to clean face, leave for 15-20 minutes, rinse." },
  { id: "prod022", productName: "Organic Chia Seed Pudding", category: "Food Products", ingredients: ["Chia Seeds", "Coconut Milk", "Vanilla"], features: ["Vegan", "Gluten Free", "Organic"], benefits: ["Digestive Health", "Energy", "Nutrition Boost"], description: "Ready-to-eat nutritious pudding packed with omega-3s.", usageInstructions: "Eat straight from container or add toppings." },
  { id: "prod023", productName: "Collagen Peptides Powder", category: "Nutrition & Wellness", ingredients: ["Collagen", "Biotin", "Vitamin C"], features: ["Gluten Free", "Dairy Free", "Non-GMO"], benefits: ["Hair Care", "Skin Health", "Joint Support"], description: "Beauty-boosting collagen for skin, hair, and nails.", usageInstructions: "Mix 1 scoop in water, juice, or smoothie daily." },
  { id: "prod024", productName: "Joint Support Capsules", category: "Health & Wellness", ingredients: ["Turmeric", "Magnesium", "Vitamin D"], features: ["Vegan", "Non-GMO", "Gluten Free"], benefits: ["Joint Health", "Mobility", "Anti-Inflammatory"], description: "Natural support for healthy joints and flexibility.", usageInstructions: "Take 2 capsules daily with food." },
  { id: "prod025", productName: "Hibiscus Vitamin C Tea", category: "Food Products", ingredients: ["Hibiscus", "Vitamin C", "Orange"], features: ["Organic", "Caffeine Free", "Natural"], benefits: ["Immunity", "Antioxidants", "Energy"], description: "Colorful herbal tea rich in vitamin C.", usageInstructions: "Steep 1 tea bag in hot water for 5 minutes." },
];

// ─── Seed function ─────────────────────────────────────────────────────────

async function seedProducts() {
  console.log('🌱  Suraj Ventures — Product Seed Script');
  console.log('─'.repeat(50));
  console.log(`📦  ${products.length} products to process`);
  console.log('');

  const col = collection(db, 'products');
  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    const slug = generateSlug(product.productName);

    try {
      // Check if a product with this slug already exists
      const existing = await getDocs(
        query(col, where('slug', '==', slug))
      );

      if (!existing.empty) {
        console.log(`⏭   Skipped (already exists): ${product.productName}`);
        skipped++;
        continue;
      }

      // Build the Firestore document
      const docData = {
        productName:       product.productName,
        slug,
        category:          product.category,
        shortDescription:  '',
        description:       product.description,
        ingredients:       product.ingredients,
        benefits:          product.benefits,
        features:          product.features,
        usageInstructions: product.usageInstructions,
        image:             '',
        imagePath:         '',
        featured:          false,
        stockStatus:       'In Stock',
        status:            'active',
        createdAt:         serverTimestamp(),
        updatedAt:         serverTimestamp(),
      };

      await addDoc(col, docData);
      console.log(`✅  Added: ${product.productName}`);
      added++;
    } catch (err) {
      console.error(`❌  Error adding ${product.productName}:`, err.message);
      errors++;
    }
  }

  console.log('');
  console.log('─'.repeat(50));
  console.log(`✅  Added:   ${added}`);
  console.log(`⏭   Skipped: ${skipped}`);
  console.log(`❌  Errors:  ${errors}`);
  console.log('');

  if (added > 0) {
    console.log('🎉  Seed complete! Your Firestore "products" collection is ready.');
    console.log('    Products will appear on the website immediately.');
  } else if (skipped === products.length) {
    console.log('ℹ️   All products already exist in Firestore. Nothing was changed.');
  }

  process.exit(errors > 0 ? 1 : 0);
}

seedProducts().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
