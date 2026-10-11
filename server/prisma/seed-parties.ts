import { prisma } from '../src/app/shared/prisma.js';

type CustomerSeed = {
  name: string;
  phone: string;
  address?: string;
  area?: string;
  category?: string;
  dueBalance?: number;
  isActive?: boolean;
};

type SupplierSeed = {
  companyName: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  tradeLicense?: string;
  paymentTerms?: number;
  payableBalance?: number;
  isActive?: boolean;
};

const customerSeeds: CustomerSeed[] = [
  {
    name: 'Anisul Haque Poultry Farm',
    phone: '01711482910',
    address: 'House 12, Road 5, Mirpur',
    area: 'mirpur',
    category: 'Wholesale',
    dueBalance: 12500.5,
  },
  { name: 'Rahim Uddin Farm', phone: '01811223344', address: 'Sector 7, Uttara', area: 'uttara', category: 'Regular' },
  {
    name: 'Karim Poultry House',
    phone: '01913112233',
    address: 'Road 8, Dhanmondi',
    area: 'dhanmondi',
    category: 'Wholesale',
    dueBalance: 8750,
  },
  {
    name: 'Fatema Begum Farm',
    phone: '01614556677',
    address: 'Block C, Gulshan',
    area: 'gulshan',
    category: 'Regular',
  },
  {
    name: 'Monsur Ali Agro',
    phone: '01515123456',
    address: 'Tajmahal Road, Mohammadpur',
    area: 'mohammadpur',
    category: 'Wholesale',
    dueBalance: 23000.75,
  },
  {
    name: 'Hasan Mahmud Poultry',
    phone: '01716112233',
    address: 'House 44, Road 2, Mirpur',
    area: 'mirpur',
    category: 'Regular',
    dueBalance: 1500,
  },
  {
    name: 'Nasrin Akter Farm',
    phone: '01817112233',
    address: 'Sector 11, Uttara',
    area: 'uttara',
    category: 'Regular',
    isActive: false,
  },
  {
    name: 'Jahangir Alam Agro',
    phone: '01918112233',
    address: 'Road 15, Dhanmondi',
    area: 'dhanmondi',
    category: 'Wholesale',
    dueBalance: 31200,
  },
  {
    name: 'Salma Khatun Poultry',
    phone: '01319112233',
    address: 'Avenue 3, Gulshan',
    area: 'gulshan',
    category: 'Regular',
    dueBalance: 750.25,
  },
  {
    name: 'Abdul Malek Farm',
    phone: '01410112233',
    address: 'Iqbal Road, Mohammadpur',
    area: 'mohammadpur',
    category: 'Regular',
  },
  {
    name: 'Shafiqul Islam Poultry',
    phone: '01711112233',
    address: 'House 8, Road 9, Mirpur',
    area: 'mirpur',
    category: 'Wholesale',
    dueBalance: 5400,
  },
  { name: 'Ruma Akter Agro', phone: '01812223344', address: 'Sector 4, Uttara', area: 'uttara', category: 'Regular' },
  {
    name: 'Delwar Hossain Farm',
    phone: '01913334455',
    address: 'Road 3, Dhanmondi',
    area: 'dhanmondi',
    category: 'Regular',
    dueBalance: 9800.5,
  },
  {
    name: 'Kohinoor Begum Poultry',
    phone: '01614445566',
    address: 'Block D, Gulshan',
    area: 'gulshan',
    category: 'Wholesale',
    dueBalance: 17500,
  },
  {
    name: 'Tariqul Islam Agro',
    phone: '01515556677',
    address: 'Shahjahan Road, Mohammadpur',
    area: 'mohammadpur',
    category: 'Regular',
    isActive: false,
  },
  {
    name: 'Faruk Ahmed Poultry',
    phone: '01716667788',
    address: 'House 21, Road 12, Mirpur',
    area: 'mirpur',
    category: 'Regular',
    dueBalance: 2200,
  },
  {
    name: 'Shabana Akter Farm',
    phone: '01817778899',
    address: 'Sector 13, Uttara',
    area: 'uttara',
    category: 'Wholesale',
    dueBalance: 41000,
  },
  {
    name: 'Mahbub Alam Poultry',
    phone: '01918889900',
    address: 'Road 27, Dhanmondi',
    area: 'dhanmondi',
    category: 'Regular',
  },
  {
    name: 'Lipi Begum Agro',
    phone: '01319990011',
    address: 'Avenue 5, Gulshan',
    area: 'gulshan',
    category: 'Regular',
    dueBalance: 630.75,
  },
  {
    name: 'Kamrul Hasan Farm',
    phone: '01410001122',
    address: 'Japan Garden City, Mohammadpur',
    area: 'mohammadpur',
    category: 'Wholesale',
    dueBalance: 14900,
  },
];

const supplierSeeds: SupplierSeed[] = [
  {
    companyName: 'ACI Animal Health',
    contactPerson: 'Md. Karimuzzaman',
    phone: '01811001122',
    address: 'Tejgaon, Dhaka',
    tradeLicense: 'TRAD-2024-1187',
    paymentTerms: 30,
    payableBalance: 45000,
  },
  {
    companyName: 'CP Bangladesh Feeds',
    contactPerson: 'Suresh Das',
    phone: '01911002233',
    address: 'Gazipur',
    tradeLicense: 'TRAD-2023-0452',
    paymentTerms: 45,
  },
  {
    companyName: 'Quality Feeds Ltd',
    contactPerson: 'Nasir Uddin',
    phone: '01711003344',
    address: 'Chattogram',
    tradeLicense: 'TRAD-2024-2201',
    paymentTerms: 30,
    payableBalance: 78500.5,
  },
  {
    companyName: 'Provita Feed & Hatcheries',
    contactPerson: 'Farhana Islam',
    phone: '01611004455',
    address: 'Savar, Dhaka',
    tradeLicense: 'TRAD-2022-9810',
    paymentTerms: 15,
  },
  {
    companyName: 'Beximco Animal Health',
    contactPerson: 'Tanvir Ahmed',
    phone: '01511005566',
    address: 'Tongi, Gazipur',
    tradeLicense: 'TRAD-2024-3345',
    paymentTerms: 30,
    payableBalance: 120000,
  },
  {
    companyName: 'Square AgroVet',
    contactPerson: 'Ruhul Amin',
    phone: '01311006677',
    address: 'Kaliakoir, Gazipur',
    tradeLicense: 'TRAD-2023-7712',
    paymentTerms: 45,
  },
  {
    companyName: 'Incepta Veterinary',
    contactPerson: 'Sharmin Sultana',
    phone: '01411007788',
    address: 'Dhamrai, Dhaka',
    tradeLicense: 'TRAD-2024-5567',
    paymentTerms: 30,
    payableBalance: 23400.75,
  },
  {
    companyName: 'Renata Animal Health',
    contactPerson: 'Mahmudul Hasan',
    phone: '01711008899',
    address: 'Rajendrapur, Gazipur',
    tradeLicense: 'TRAD-2022-1123',
    paymentTerms: 15,
  },
  {
    companyName: 'Eon Animal Health',
    contactPerson: 'Abdul Kader',
    phone: '01811009900',
    address: 'Bogura',
    tradeLicense: 'TRAD-2023-8890',
    paymentTerms: 30,
    payableBalance: 56700,
  },
  {
    companyName: 'Orion Pharma Vet Division',
    contactPerson: 'Lipon Kumar',
    phone: '01911001100',
    address: 'Siddhirganj, Narayanganj',
    tradeLicense: 'TRAD-2024-6678',
    paymentTerms: 30,
  },
  {
    companyName: 'Popular Poultry Feed Mill',
    contactPerson: 'Golam Rabbani',
    phone: '01611002211',
    address: 'Mymensingh',
    tradeLicense: 'TRAD-2021-4532',
    paymentTerms: 45,
    payableBalance: 89250,
  },
  {
    companyName: 'Nourish Poultry Feeds',
    contactPerson: 'Sadia Afrin',
    phone: '01511003322',
    address: 'Bhaluka, Mymensingh',
    tradeLicense: 'TRAD-2023-2398',
    paymentTerms: 30,
  },
  {
    companyName: 'Aman Feed Mills',
    contactPerson: 'Harunur Rashid',
    phone: '01311004433',
    address: 'Ashulia, Dhaka',
    tradeLicense: 'TRAD-2022-6754',
    paymentTerms: 15,
    payableBalance: 31200.25,
  },
  {
    companyName: 'Paragon Poultry Ltd',
    contactPerson: 'Emdadul Haque',
    phone: '01411005544',
    address: 'Bhaluka, Mymensingh',
    tradeLicense: 'TRAD-2024-9081',
    paymentTerms: 30,
    isActive: false,
  },
  {
    companyName: 'Kazi Farms Feed',
    contactPerson: 'Rezaul Karim',
    phone: '01711006655',
    address: 'Panchdona, Narsingdi',
    tradeLicense: 'TRAD-2023-1209',
    paymentTerms: 45,
    payableBalance: 64500,
  },
  {
    companyName: 'Aftab Feed Products',
    contactPerson: 'Mizanur Rahman',
    phone: '01811007766',
    address: 'Bajitpur, Kishoreganj',
    tradeLicense: 'TRAD-2022-3456',
    paymentTerms: 30,
  },
  {
    companyName: "Doctor's Agro-Vet",
    contactPerson: 'Nasima Begum',
    phone: '01911008877',
    address: 'Mirpur, Dhaka',
    tradeLicense: 'TRAD-2024-7834',
    paymentTerms: 15,
    payableBalance: 9800,
  },
  {
    companyName: 'General Poultry Feeds',
    contactPerson: 'Alamgir Hossain',
    phone: '01611009988',
    address: 'Sreepur, Gazipur',
    tradeLicense: 'TRAD-2023-5621',
    paymentTerms: 30,
  },
  {
    companyName: 'Trust Poultry & Fisheries',
    contactPerson: 'Kamal Pasha',
    phone: '01511000099',
    address: 'Cumilla',
    tradeLicense: 'TRAD-2024-4102',
    paymentTerms: 30,
    payableBalance: 42750.5,
  },
  {
    companyName: 'Bengal Veterinary Supplies',
    contactPerson: 'Shahnaz Parvin',
    phone: '01311001199',
    address: 'Jashore',
    tradeLicense: 'TRAD-2022-8367',
    paymentTerms: 15,
  },
];

export const seedParties = async (): Promise<void> => {
  // Re-running the seed never touches existing rows (update: {}).
  for (const c of customerSeeds) {
    const customer = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: {},
      create: {
        name: c.name,
        phone: c.phone,
        ...(c.address !== undefined ? { address: c.address } : {}),
        ...(c.area !== undefined ? { area: c.area } : {}),
        ...(c.category !== undefined ? { category: c.category } : {}),
        ...(c.dueBalance !== undefined ? { dueBalance: c.dueBalance } : {}),
        ...(c.isActive !== undefined ? { isActive: c.isActive } : {}),
      },
    });
    console.log(`Seeded customer: ${customer.name} (${customer.phone})`);
  }

  for (const s of supplierSeeds) {
    const supplier = await prisma.supplier.upsert({
      where: { phone: s.phone },
      update: {},
      create: {
        companyName: s.companyName,
        phone: s.phone,
        ...(s.contactPerson !== undefined ? { contactPerson: s.contactPerson } : {}),
        ...(s.address !== undefined ? { address: s.address } : {}),
        ...(s.tradeLicense !== undefined ? { tradeLicense: s.tradeLicense } : {}),
        ...(s.paymentTerms !== undefined ? { paymentTerms: s.paymentTerms } : {}),
        ...(s.payableBalance !== undefined ? { payableBalance: s.payableBalance } : {}),
        ...(s.isActive !== undefined ? { isActive: s.isActive } : {}),
      },
    });
    console.log(`Seeded supplier: ${supplier.companyName} (${supplier.phone})`);
  }
};
