import { prisma } from '../src/app/shared/prisma.js';

type ProductSeed = {
  productType: 'MEDICINE' | 'FEED';
  name: string;
  description: string;
  categoryName: string;
  unit: 'PIECE' | 'STRIP' | 'BOTTLE' | 'BOX' | 'VIAL' | 'AMPOULE' | 'TUBE' | 'SACHET' | 'BAG' | 'KG' | 'LITER';
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  vatPercent: number;
  manufacturer: string;
  medicineDetails?: { form?: string; genericName?: string; strength?: string; requiresPrescription?: boolean };
  feedDetails?: { targetSpecies?: string; feedType?: string; proteinPct?: number; nominalPackKg?: number };
  initialBatch: { batchNumber: string; expiryDate?: string; stock: number; weightKg?: number };
};

const productSeeds: ProductSeed[] = [
  // ─── MEDICINES ────────────────────────────────────────────────
  {
    productType: 'MEDICINE',
    name: 'Napa 500mg Strip',
    description: 'Paracetamol 500mg — 10 tablets per strip',
    categoryName: 'Pain Relief',
    unit: 'STRIP',
    purchasePrice: 18.0,
    sellingPrice: 25.0,
    minStock: 20,
    vatPercent: 0,
    manufacturer: 'Beximco',
    medicineDetails: { form: 'TABLET', genericName: 'Paracetamol', strength: '500mg' },
    initialBatch: { batchNumber: 'NP-500-202601', expiryDate: '2027-06-30', stock: 50 },
  },
  {
    productType: 'MEDICINE',
    name: 'Pet Vitamin Syrup',
    description: 'Multivitamin for cats and dogs',
    categoryName: 'Vitamins & Supplements',
    unit: 'BOTTLE',
    purchasePrice: 380.0,
    sellingPrice: 450.0,
    minStock: 10,
    vatPercent: 0,
    manufacturer: 'Square',
    medicineDetails: { form: 'SYRUP', genericName: 'Multivitamin' },
    initialBatch: { batchNumber: 'PV-202601', expiryDate: '2027-12-31', stock: 200 },
  },
  {
    productType: 'MEDICINE',
    name: 'Ivermectin 1% Injection',
    description: 'Antiparasitic injectable for cattle, sheep, and goats',
    categoryName: 'Antiparasitic',
    unit: 'VIAL',
    purchasePrice: 120.0,
    sellingPrice: 150.0,
    minStock: 30,
    vatPercent: 0,
    manufacturer: 'EcoMed',
    medicineDetails: { form: 'INJECTION', genericName: 'Ivermectin', strength: '1%', requiresPrescription: true },
    initialBatch: { batchNumber: 'IV-1PCT-202601', expiryDate: '2028-01-15', stock: 100 },
  },
  {
    productType: 'MEDICINE',
    name: 'Amoxicillin 250mg Capsule',
    description: 'Broad-spectrum antibiotic for dogs and cats',
    categoryName: 'Antibiotics',
    unit: 'STRIP',
    purchasePrice: 35.0,
    sellingPrice: 50.0,
    minStock: 25,
    vatPercent: 0,
    manufacturer: 'Incepta',
    medicineDetails: { form: 'CAPSULE', genericName: 'Amoxicillin', strength: '250mg', requiresPrescription: true },
    initialBatch: { batchNumber: 'AMX-250-202601', expiryDate: '2027-09-30', stock: 80 },
  },
  {
    productType: 'MEDICINE',
    name: 'Meloxicam 5mg Tablet',
    description: 'NSAID for pain and inflammation in dogs',
    categoryName: 'Pain Relief',
    unit: 'STRIP',
    purchasePrice: 45.0,
    sellingPrice: 65.0,
    minStock: 15,
    vatPercent: 0,
    manufacturer: 'Opsonin',
    medicineDetails: { form: 'TABLET', genericName: 'Meloxicam', strength: '5mg', requiresPrescription: true },
    initialBatch: { batchNumber: 'MLX-5MG-202601', expiryDate: '2027-08-31', stock: 60 },
  },
  {
    productType: 'MEDICINE',
    name: 'Metronidazole 200mg Tablet',
    description: 'Antiprotozoal and antibiotic for pets',
    categoryName: 'Antibiotics',
    unit: 'STRIP',
    purchasePrice: 22.0,
    sellingPrice: 35.0,
    minStock: 20,
    vatPercent: 0,
    manufacturer: 'Square',
    medicineDetails: { form: 'TABLET', genericName: 'Metronidazole', strength: '200mg', requiresPrescription: true },
    initialBatch: { batchNumber: 'MTR-200-202601', expiryDate: '2027-07-31', stock: 90 },
  },
  {
    productType: 'MEDICINE',
    name: 'Cephalexin 500mg Capsule',
    description: 'First-generation cephalosporin for skin infections',
    categoryName: 'Antibiotics',
    unit: 'STRIP',
    purchasePrice: 55.0,
    sellingPrice: 80.0,
    minStock: 15,
    vatPercent: 0,
    manufacturer: 'Beximco',
    medicineDetails: { form: 'CAPSULE', genericName: 'Cephalexin', strength: '500mg', requiresPrescription: true },
    initialBatch: { batchNumber: 'CPX-500-202601', expiryDate: '2027-10-31', stock: 45 },
  },
  {
    productType: 'MEDICINE',
    name: 'Prednisolone 5mg Tablet',
    description: 'Corticosteroid for allergic and inflammatory conditions',
    categoryName: 'Corticosteroids',
    unit: 'STRIP',
    purchasePrice: 15.0,
    sellingPrice: 25.0,
    minStock: 25,
    vatPercent: 0,
    manufacturer: 'Renata',
    medicineDetails: { form: 'TABLET', genericName: 'Prednisolone', strength: '5mg', requiresPrescription: true },
    initialBatch: { batchNumber: 'PRN-5MG-202601', expiryDate: '2027-11-30', stock: 120 },
  },
  {
    productType: 'MEDICINE',
    name: 'Dexamethasone Injection',
    description: 'Corticosteroid injection for emergencies',
    categoryName: 'Corticosteroids',
    unit: 'VIAL',
    purchasePrice: 65.0,
    sellingPrice: 90.0,
    minStock: 10,
    vatPercent: 0,
    manufacturer: 'ACI',
    medicineDetails: { form: 'INJECTION', genericName: 'Dexamethasone', strength: '4mg/mL', requiresPrescription: true },
    initialBatch: { batchNumber: 'DEX-4MG-202601', expiryDate: '2028-03-31', stock: 40 },
  },
  {
    productType: 'MEDICINE',
    name: 'Rabies Vaccine (10 dose)',
    description: 'Inactivated rabies vaccine for dogs and cats',
    categoryName: 'Vaccines',
    unit: 'VIAL',
    purchasePrice: 350.0,
    sellingPrice: 500.0,
    minStock: 5,
    vatPercent: 0,
    manufacturer: 'IBA',
    medicineDetails: { genericName: 'Rabies Vaccine' },
    initialBatch: { batchNumber: 'RAB-10D-202601', expiryDate: '2027-03-31', stock: 30 },
  },
  {
    productType: 'MEDICINE',
    name: 'Canine Distemper Vaccine',
    description: 'MLV vaccine for canine distemper complex',
    categoryName: 'Vaccines',
    unit: 'VIAL',
    purchasePrice: 180.0,
    sellingPrice: 250.0,
    minStock: 5,
    vatPercent: 0,
    manufacturer: 'VetriScience',
    medicineDetails: { genericName: 'Distemper Vaccine' },
    initialBatch: { batchNumber: 'CDV-202601', expiryDate: '2027-06-30', stock: 25 },
  },
  {
    productType: 'MEDICINE',
    name: 'Ear Drops 15mL',
    description: 'Antibacterial and antifungal ear drops for dogs and cats',
    categoryName: 'Dermatology',
    unit: 'BOTTLE',
    purchasePrice: 95.0,
    sellingPrice: 130.0,
    minStock: 10,
    vatPercent: 0,
    manufacturer: 'EcoMed',
    medicineDetails: { form: 'DROPS', genericName: 'Otix Ear Drops' },
    initialBatch: { batchNumber: 'EAR-15ML-202601', expiryDate: '2027-05-31', stock: 35 },
  },
  {
    productType: 'MEDICINE',
    name: 'Wound Healing Ointment 20g',
    description: 'Antiseptic ointment for minor wounds and burns',
    categoryName: 'Dermatology',
    unit: 'TUBE',
    purchasePrice: 75.0,
    sellingPrice: 110.0,
    minStock: 12,
    vatPercent: 0,
    manufacturer: 'Square',
    medicineDetails: { form: 'OINTMENT', genericName: 'Povidone Iodine Ointment' },
    initialBatch: { batchNumber: 'WNO-20G-202601', expiryDate: '2028-01-31', stock: 50 },
  },
  {
    productType: 'MEDICINE',
    name: 'Deworming Suspension 30mL',
    description: 'Broad-spectrum dewormer for puppies and kittens',
    categoryName: 'Antiparasitic',
    unit: 'BOTTLE',
    purchasePrice: 85.0,
    sellingPrice: 120.0,
    minStock: 15,
    vatPercent: 0,
    manufacturer: 'Opsonin',
    medicineDetails: { form: 'SUSPENSION', genericName: 'Pyrantel Pamoate', strength: '30mL' },
    initialBatch: { batchNumber: 'DEW-30ML-202601', expiryDate: '2027-09-30', stock: 60 },
  },

  // ─── FEEDS ────────────────────────────────────────────────────
  {
    productType: 'FEED',
    name: 'ACI Layer 25kg',
    description: 'Layer feed 25kg bag for commercial layer hens',
    categoryName: 'Poultry Feed',
    unit: 'BAG',
    purchasePrice: 1850.0,
    sellingPrice: 1950.0,
    minStock: 20,
    vatPercent: 0,
    manufacturer: 'ACI',
    feedDetails: { targetSpecies: 'Poultry', feedType: 'Layer', proteinPct: 16.5, nominalPackKg: 25 },
    initialBatch: { batchNumber: 'ACI-LYR-202601', expiryDate: '2027-06-30', stock: 100, weightKg: 2500 },
  },
  {
    productType: 'FEED',
    name: 'ACI Broiler Finisher 25kg',
    description: 'Finisher feed for broiler chickens (35-42 days)',
    categoryName: 'Poultry Feed',
    unit: 'BAG',
    purchasePrice: 1900.0,
    sellingPrice: 2000.0,
    minStock: 15,
    vatPercent: 0,
    manufacturer: 'ACI',
    feedDetails: { targetSpecies: 'Poultry', feedType: 'Broiler Finisher', proteinPct: 18.0, nominalPackKg: 25 },
    initialBatch: { batchNumber: 'ACI-BF-202601', expiryDate: '2027-05-31', stock: 80, weightKg: 2000 },
  },
  {
    productType: 'FEED',
    name: 'Pristine Goat Feed 20kg',
    description: 'Balanced feed for growing and adult goats',
    categoryName: 'Livestock Feed',
    unit: 'BAG',
    purchasePrice: 1200.0,
    sellingPrice: 1350.0,
    minStock: 10,
    vatPercent: 0,
    manufacturer: 'Pristine',
    feedDetails: { targetSpecies: 'Goat', feedType: 'Mixed', proteinPct: 14.0, nominalPackKg: 20 },
    initialBatch: { batchNumber: 'PRG-20KG-202601', expiryDate: '2027-04-30', stock: 50, weightKg: 1000 },
  },
  {
    productType: 'FEED',
    name: 'Cat Chow Adult 3kg',
    description: 'Complete nutrition for adult indoor cats',
    categoryName: 'Pet Food',
    unit: 'BAG',
    purchasePrice: 850.0,
    sellingPrice: 980.0,
    minStock: 8,
    vatPercent: 0,
    manufacturer: 'Purina',
    feedDetails: { targetSpecies: 'Cat', feedType: 'Dry', proteinPct: 30.0, nominalPackKg: 3 },
    initialBatch: { batchNumber: 'CC-ADT-3K-202601', expiryDate: '2027-08-31', stock: 40, weightKg: 120 },
  },
  {
    productType: 'FEED',
    name: 'Pedigree Adult Dog Food 5kg',
    description: 'Complete dry food for adult dogs',
    categoryName: 'Pet Food',
    unit: 'BAG',
    purchasePrice: 950.0,
    sellingPrice: 1100.0,
    minStock: 10,
    vatPercent: 0,
    manufacturer: 'Mars',
    feedDetails: { targetSpecies: 'Dog', feedType: 'Dry', proteinPct: 24.0, nominalPackKg: 5 },
    initialBatch: { batchNumber: 'PDG-ADT-5K-202601', expiryDate: '2027-10-31', stock: 35, weightKg: 175 },
  },
  {
    productType: 'FEED',
    name: 'Dairy Concentrate 50kg',
    description: 'High-energy concentrate for dairy cattle',
    categoryName: 'Livestock Feed',
    unit: 'BAG',
    purchasePrice: 2800.0,
    sellingPrice: 3100.0,
    minStock: 5,
    vatPercent: 0,
    manufacturer: 'Aftab',
    feedDetails: { targetSpecies: 'Cattle', feedType: 'Concentrate', proteinPct: 20.0, nominalPackKg: 50 },
    initialBatch: { batchNumber: 'DC-50KG-202601', expiryDate: '2027-03-31', stock: 30, weightKg: 1500 },
  },
  {
    productType: 'FEED',
    name: 'Fish Feed Floating 25kg',
    description: 'Floating pellet feed for carp and tilapia',
    categoryName: 'Aquaculture Feed',
    unit: 'BAG',
    purchasePrice: 1600.0,
    sellingPrice: 1800.0,
    minStock: 10,
    vatPercent: 0,
    manufacturer: 'Quality Feeds',
    feedDetails: { targetSpecies: 'Fish', feedType: 'Floating Pellet', proteinPct: 28.0, nominalPackKg: 25 },
    initialBatch: { batchNumber: 'FF-FLT-25K-202601', expiryDate: '2027-02-28', stock: 60, weightKg: 1500 },
  },
];

export const seedProducts = async (): Promise<void> => {
  // Ensure required categories exist.
  const categoryCache = new Map<string, string>();

  for (const p of productSeeds) {
    const catKey = `${p.productType}:${p.categoryName}`;
    if (!categoryCache.has(catKey)) {
      const cat = await prisma.category.upsert({
        where: { productType_name: { productType: p.productType, name: p.categoryName } },
        update: {},
        create: { productType: p.productType, name: p.categoryName },
      });
      categoryCache.set(catKey, cat.id);
    }
  }

  for (const p of productSeeds) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      console.log(`Skipping (exists): ${p.name}`);
      continue;
    }

    const catId = categoryCache.get(`${p.productType}:${p.categoryName}`)!;
    // categoryName drives the category lookup above; omit it from the create payload.
    const { medicineDetails, feedDetails, initialBatch, categoryName: _excluded, ...base } = p;
    void _excluded;

    const created = await prisma.product.create({
      data: {
        ...base,
        categoryId: catId,
        ...(medicineDetails
          ? {
              medicineDetails: {
                create: {
                  form: medicineDetails.form as any,
                  genericName: medicineDetails.genericName,
                  strength: medicineDetails.strength,
                  requiresPrescription: medicineDetails.requiresPrescription ?? false,
                },
              },
            }
          : {}),
        ...(feedDetails
          ? {
              feedDetails: {
                create: {
                  targetSpecies: feedDetails.targetSpecies,
                  feedType: feedDetails.feedType,
                  proteinPct: feedDetails.proteinPct,
                  nominalPackKg: feedDetails.nominalPackKg,
                },
              },
            }
          : {}),
      },
    });

    const batch = await prisma.productBatch.create({
      data: {
        productId: created.id,
        batchNumber: initialBatch.batchNumber,
        expiryDate: initialBatch.expiryDate ? new Date(initialBatch.expiryDate) : null,
        purchasePrice: base.purchasePrice,
        stock: initialBatch.stock,
        ...(initialBatch.weightKg !== undefined ? { weightKg: initialBatch.weightKg } : {}),
      },
    });

    await prisma.stockLedger.create({
      data: {
        productId: created.id,
        batchId: batch.id,
        type: 'OPENING',
        qtyDelta: initialBatch.stock,
        stockAfter: initialBatch.stock,
      },
    });

    console.log(`Seeded product: ${p.name} (+ OPENING batch ${initialBatch.batchNumber})`);
  }
};
