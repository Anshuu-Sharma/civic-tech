/**
 * seed-demo.ts — JanSunwai AI Demo Seed Data
 *
 * Creates realistic civic grievance data for demo/hackathon presentation:
 * - 12 wards across Delhi zones
 * - 8 departments mapped to grievance categories
 * - 20 officers with password hashes
 * - 30 citizens with varied vulnerability flags
 * - 142 grievances across all 12 categories with timelines
 * - Mix of statuses: open, acknowledged, in_progress, resolved, escalated, reopened
 *
 * Usage: npx tsx src/scripts/seed-demo.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// =============================================================================
// Static Data
// =============================================================================

const WARDS = [
  { name: 'Connaught Place', number: 1, zone: 'Central' },
  { name: 'Karol Bagh', number: 2, zone: 'Central' },
  { name: 'Chandni Chowk', number: 3, zone: 'North' },
  { name: 'Sadar Bazaar', number: 4, zone: 'North' },
  { name: 'Rajouri Garden', number: 5, zone: 'West' },
  { name: 'Dwarka', number: 6, zone: 'South-West' },
  { name: 'Nehru Place', number: 7, zone: 'South' },
  { name: 'Lajpat Nagar', number: 8, zone: 'South' },
  { name: 'Rohini', number: 9, zone: 'North-West' },
  { name: 'Shahdara', number: 10, zone: 'East' },
  { name: 'Mayur Vihar', number: 11, zone: 'East' },
  { name: 'Vasant Kunj', number: 12, zone: 'South-West' },
];

const DEPARTMENTS = [
  { name: 'Water Supply Department', categories: ['water_supply'] },
  { name: 'Electricity Board (BSES/Tata Power)', categories: ['electricity'] },
  { name: 'Public Works Department (PWD)', categories: ['roads_potholes', 'building_construction'] },
  { name: 'Sanitation & Waste Management', categories: ['sanitation_garbage'] },
  { name: 'Drainage & Sewage Division', categories: ['drainage_sewage'] },
  { name: 'Street Lighting Cell', categories: ['street_lighting'] },
  { name: 'Delhi Transport Corporation', categories: ['public_transport'] },
  { name: 'Food & Civil Supplies', categories: ['ration_card_pds', 'pension_welfare'] },
  { name: 'Anti-Corruption Bureau', categories: ['corruption_misconduct'] },
  { name: 'Horticulture & Parks Division', categories: ['parks_public_spaces'] },
];

const OFFICER_NAMES = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Singh', 'Neha Gupta', 'Suresh Verma',
  'Anita Joshi', 'Vikram Reddy', 'Sunita Patel', 'Manoj Tiwari', 'Kavita Rao',
  'Deepak Mishra', 'Ritu Agarwal', 'Sanjay Dubey', 'Pooja Chauhan', 'Rahul Saxena',
  'Meera Nair', 'Arun Pandey', 'Geeta Bhatt', 'Rohit Khanna', 'Divya Kapoor',
];

const CITIZEN_DATA = [
  { name: 'Ramesh Prasad', phone: '9876543210', lang: 'hi', vuln: [] },
  { name: 'Fatima Begum', phone: '9876543211', lang: 'hi', vuln: ['elderly'] },
  { name: 'Sukhbir Singh', phone: '9876543212', lang: 'hi', vuln: [] },
  { name: 'Lakshmi Devi', phone: '9876543213', lang: 'hi', vuln: ['bpl', 'elderly'] },
  { name: 'Mohammed Iqbal', phone: '9876543214', lang: 'hi', vuln: [] },
  { name: 'Priya Kumari', phone: '9876543215', lang: 'en', vuln: ['pregnant'] },
  { name: 'Raju Chamar', phone: '9876543216', lang: 'hi', vuln: ['bpl'] },
  { name: 'Geeta Devi', phone: '9876543217', lang: 'hi', vuln: ['disabled'] },
  { name: 'Anand Sharma', phone: '9876543218', lang: 'en', vuln: [] },
  { name: 'Kamla Bai', phone: '9876543219', lang: 'hi', vuln: ['elderly', 'bpl'] },
  { name: 'Vijay Kumar', phone: '9876543220', lang: 'hi', vuln: [] },
  { name: 'Nirmala Sinha', phone: '9876543221', lang: 'en', vuln: [] },
  { name: 'Arjun Yadav', phone: '9876543222', lang: 'hi', vuln: [] },
  { name: 'Savitri Devi', phone: '9876543223', lang: 'hi', vuln: ['pregnant', 'bpl'] },
  { name: 'Deepak Jha', phone: '9876543224', lang: 'hi', vuln: [] },
  { name: 'Radha Krishnan', phone: '9876543225', lang: 'en', vuln: ['disabled'] },
  { name: 'Harsh Vardhan', phone: '9876543226', lang: 'hi', vuln: [] },
  { name: 'Manju Lata', phone: '9876543227', lang: 'hi', vuln: ['elderly'] },
  { name: 'Sanjay Gupta', phone: '9876543228', lang: 'en', vuln: [] },
  { name: 'Parveen Akhtar', phone: '9876543229', lang: 'hi', vuln: [] },
  { name: 'Gopal Das', phone: '9876543230', lang: 'hi', vuln: ['bpl'] },
  { name: 'Sunita Rani', phone: '9876543231', lang: 'hi', vuln: [] },
  { name: 'Bhagwat Prasad', phone: '9876543232', lang: 'hi', vuln: ['elderly', 'disabled'] },
  { name: 'Reshma Bi', phone: '9876543233', lang: 'hi', vuln: ['bpl'] },
  { name: 'Ajay Thakur', phone: '9876543234', lang: 'en', vuln: [] },
  { name: 'Durgesh Patel', phone: '9876543235', lang: 'hi', vuln: [] },
  { name: 'Kiran Bala', phone: '9876543236', lang: 'hi', vuln: ['pregnant'] },
  { name: 'Mahesh Chand', phone: '9876543237', lang: 'hi', vuln: ['bpl'] },
  { name: 'Asha Kumari', phone: '9876543238', lang: 'hi', vuln: [] },
  { name: 'Balram Singh', phone: '9876543239', lang: 'hi', vuln: ['elderly'] },
];

// Grievance templates per category
const GRIEVANCE_TEMPLATES: Record<string, { descriptions: string[]; subCategories: string[] }> = {
  water_supply: {
    descriptions: [
      'No water supply since 3 days in our colony. Tanker not coming.',
      'Water pressure extremely low. Cannot fill even one bucket in 30 minutes.',
      'Contaminated water coming from tap. Brown/yellow color. Children falling sick.',
      'Water pipeline burst on main road. Water wasting for 2 days. MCD not responding.',
      'Borewell in our area has run dry. Need alternative water arrangement urgently.',
      'Sewage water mixing with drinking water supply. Very dangerous situation.',
      'Water meter showing wrong reading. Charged Rs 5000 for one month.',
      'No water connection approved despite applying 6 months ago.',
      'Water tanker mafia charging Rs 500 per tanker. Government supply not reaching.',
      'Overhead tank leaking in government housing colony. Wasting thousands of litres daily.',
      'RO plant in colony not working for 2 weeks. MCD not repairing.',
      'Jal Board office demanding bribe of Rs 2000 for new connection.',
    ],
    subCategories: ['no_supply', 'low_pressure', 'contamination', 'pipeline_burst', 'billing_dispute', 'new_connection'],
  },
  electricity: {
    descriptions: [
      'Power cuts of 8-10 hours daily in our area. Transformer keeps tripping.',
      'Street transformer caught fire 3 days ago. Still not replaced. No electricity.',
      'Electricity bill showing Rs 15000 for a 1BHK flat. Clearly wrong meter reading.',
      'Exposed electric wires hanging near children\'s park. Life threatening.',
      'Load shedding during peak summer. 45 degree heat. Elderly people suffering.',
      'New electricity meter not installed despite paying fees 4 months ago.',
      'Frequent voltage fluctuation destroying home appliances.',
      'BSES lineman demanding Rs 3000 to restore connection after storm damage.',
      'Streetlight transformer humming loudly at night. Cannot sleep. Fire hazard.',
      'Prepaid meter installed without consent. Being overcharged.',
    ],
    subCategories: ['power_outage', 'transformer_failure', 'billing_issue', 'safety_hazard', 'new_connection', 'voltage_issue'],
  },
  roads_potholes: {
    descriptions: [
      'Massive pothole on main road near bus stop. 3 accidents this week.',
      'Road completely broken after monsoon. No repair since 6 months.',
      'Construction debris dumped on road by builder. Blocking half the road.',
      'Speed breaker built too high. Cars getting damaged. No reflectors.',
      'Road caved in due to drain construction. No barricading. Very dangerous at night.',
      'Footpath encroached by vendors. Pedestrians forced to walk on road.',
      'Road divider broken. Vehicles taking wrong side. Major accident risk.',
      'PWD dug up road for pipeline and never filled it back. 3 months now.',
      'No road markings or zebra crossing near school. Children at risk.',
      'Waterlogging on road every rain. Drain not connected properly.',
      'Flyover construction debris blocking residential lane for weeks.',
      'Tar road melting in summer heat. Shoes getting stuck.',
    ],
    subCategories: ['pothole', 'road_damage', 'construction_debris', 'waterlogging', 'footpath', 'missing_markings'],
  },
  sanitation_garbage: {
    descriptions: [
      'Garbage not collected for 7 days. Pile growing on street corner. Stench unbearable.',
      'MCD garbage truck skipping our lane daily. Complaint ignored.',
      'Open dumping ground next to school. Children getting respiratory problems.',
      'Stray dogs and pigs feeding on open garbage. Unsafe for children.',
      'Dustbin overflow at market. Flies and mosquitoes everywhere.',
      'No dustbin provided for new residential colony. Filing since 2 months.',
      'Garbage truck comes at 4 AM. Horn disturbing entire colony sleep.',
      'Drain cleaning not done before monsoon. Now everything flooded.',
      'Construction waste dumped in vacant plot. Becoming breeding ground for mosquitoes.',
      'E-waste burning in open area. Toxic smoke affecting nearby houses.',
      'Dead animal carcass on road for 3 days. MCD not removing.',
    ],
    subCategories: ['garbage_collection', 'open_dumping', 'no_dustbin', 'drain_cleaning', 'dead_animal', 'ewaste'],
  },
  drainage_sewage: {
    descriptions: [
      'Sewage overflowing from manhole on main road. Terrible smell.',
      'Drain blocked near our house. Sewage water entering home during rain.',
      'Open drain without cover near children play area. Child fell in last week.',
      'Sewage pipe burst underground. Water seeping into foundation of our building.',
      'Drain construction started 6 months ago. Left incomplete. Open trench dangerous.',
      'Mosquito breeding in stagnant drain water. Dengue cases increasing.',
      'Sewage treatment plant emitting foul smell 24/7. Cannot open windows.',
      'Manhole cover missing on busy road. Two-wheeler fell in yesterday.',
    ],
    subCategories: ['overflow', 'blocked_drain', 'open_drain', 'pipe_burst', 'manhole', 'mosquito_breeding'],
  },
  street_lighting: {
    descriptions: [
      'No street lights on entire lane. Women afraid to walk after dark.',
      'Street light flickering for 2 months. MCD not fixing.',
      'New LED lights installed but 50% not working within first month.',
      'Dark patch on highway stretch. Multiple chain snatching incidents.',
      'Street light pole damaged in accident. Wires hanging exposed.',
      'Park lights not working. Anti-social elements gathering there at night.',
      'Timer on street lights wrong. Switching off at 9 PM instead of 6 AM.',
    ],
    subCategories: ['no_light', 'damaged_light', 'exposed_wires', 'timer_issue', 'park_lighting'],
  },
  public_transport: {
    descriptions: [
      'Bus route 522 cancelled without notice. 5000 daily commuters affected.',
      'DTC bus conductor refused to give ticket. Pocketing cash fares.',
      'Bus shelter collapsed during storm. Not rebuilt in 3 months.',
      'No bus service to our colony after 8 PM. Women safety concern.',
      'Metro feeder bus extremely overcrowded. Running only 2 instead of 6.',
      'Auto/taxi drivers overcharging outside metro station. No meter usage.',
    ],
    subCategories: ['route_cancelled', 'corruption', 'bus_shelter', 'last_mile', 'overcrowding', 'overcharging'],
  },
  ration_card_pds: {
    descriptions: [
      'Ration shop giving only half the entitled quantity of rice and wheat.',
      'Ration card application pending for 8 months. Family of 6 not getting ration.',
      'PDS shop owner selling BPL quota in open market. Direct corruption.',
      'Aadhaar authentication failing at ration shop. Biometric not matching.',
      'Ration shop open only 2 days a week instead of mandatory 5 days.',
      'Quality of PDS rice very poor. Full of stones and insects.',
      'Widow pension stopped without reason. Applied for restoration 3 months ago.',
    ],
    subCategories: ['short_measure', 'new_card', 'corruption', 'aadhaar_issue', 'shop_timing', 'quality', 'pension'],
  },
  pension_welfare: {
    descriptions: [
      'Old age pension stopped since January. No explanation from office.',
      'Disability pension application rejected without valid reason.',
      'BPL card not issued despite meeting all criteria. Office asking for bribe.',
      'Scholarship amount for daughter not credited since 6 months.',
      'Anganwadi centre closed in our area. Children not getting mid-day nutrition.',
    ],
    subCategories: ['pension_stopped', 'application_rejected', 'bpl_card', 'scholarship', 'anganwadi'],
  },
  corruption_misconduct: {
    descriptions: [
      'MCD building inspector demanding Rs 50000 bribe for building permission.',
      'Traffic police taking Rs 500 bribe instead of issuing proper challan.',
      'Government school principal diverting mid-day meal funds. Children going hungry.',
      'Hospital staff demanding money for free medicines that should be free under scheme.',
      'Revenue office babu asking Rs 10000 for property mutation that is free of cost.',
      'Panchayat sarpanch misusing MNREGA funds. Fake job cards being created.',
    ],
    subCategories: ['bribery', 'misuse_of_funds', 'fake_records', 'extortion'],
  },
  building_construction: {
    descriptions: [
      'Illegal construction happening in residential zone. No building permission.',
      'Builder constructing extra floors beyond sanctioned plan. Structural risk.',
      'Neighbouring house construction damaging our wall. Builder not responding.',
      'Incomplete building left abandoned. Becoming shelter for anti-social elements.',
      'Government building wall cracking. Risk of collapse on pedestrians.',
    ],
    subCategories: ['illegal_construction', 'extra_floors', 'structural_damage', 'abandoned_building'],
  },
  parks_public_spaces: {
    descriptions: [
      'Park playground equipment broken and rusted. Children getting injured.',
      'Public park being encroached by food vendor. No action by MCD.',
      'No maintenance of park for 1 year. Overgrown grass and broken benches.',
      'Open gym equipment in park all broken. Installed just 6 months ago.',
      'Stray dogs menace in public park. Morning walkers being chased daily.',
      'Public toilet in park permanently locked. People forced to use open area.',
    ],
    subCategories: ['broken_equipment', 'encroachment', 'no_maintenance', 'stray_animals', 'toilet'],
  },
};

const LEGAL_RIGHTS_DATA = [
  { category: 'water_supply', law: 'Article 21 - Right to Clean Water (Supreme Court ruling)', summary: 'The right to clean drinking water is a fundamental right under Article 21 of the Constitution.', sla: 7, section: 'Article 21, Constitution of India', state: 'central' },
  { category: 'water_supply', law: 'Delhi Jal Board Act, 1998', summary: 'DJB is mandated to provide minimum 50 litres per capita per day. Complaints must be addressed within 48 hours.', sla: 2, section: 'Section 12', state: 'delhi' },
  { category: 'electricity', law: 'Electricity Act, 2003', summary: 'Distribution companies must resolve supply complaints within 48 hours. Billing disputes within 14 days.', sla: 14, section: 'Section 57', state: 'central' },
  { category: 'roads_potholes', law: 'Municipal Corporation Act', summary: 'Potholes must be repaired within 48 hours of reporting per Supreme Court directive.', sla: 2, section: 'Various', state: 'central' },
  { category: 'sanitation_garbage', law: 'Solid Waste Management Rules, 2016', summary: 'Municipalities must ensure door-to-door waste collection. Citizens can file complaints for non-compliance.', sla: 3, section: 'Rule 15', state: 'central' },
  { category: 'drainage_sewage', law: 'Water (Prevention and Control of Pollution) Act, 1974', summary: 'Local bodies cannot discharge sewage without treatment. Citizens can report pollution to Pollution Control Board.', sla: 7, section: 'Section 24', state: 'central' },
  { category: 'street_lighting', law: 'Municipal Corporation Act', summary: 'Provision of street lighting is a mandatory obligation of the municipality.', sla: 3, section: 'Schedule XII', state: 'central' },
  { category: 'public_transport', law: 'Motor Vehicles Act, 2019', summary: 'Citizens have the right to safe and affordable public transport. Overcharging is punishable.', sla: 7, section: 'Section 178', state: 'central' },
  { category: 'ration_card_pds', law: 'National Food Security Act, 2013', summary: 'Every eligible household is entitled to 5 kg of foodgrain per person per month at subsidized rates.', sla: 7, section: 'Section 3', state: 'central' },
  { category: 'pension_welfare', law: 'National Social Assistance Programme', summary: 'Eligible elderly, disabled, and widowed persons are entitled to monthly pension under NSAP.', sla: 14, section: 'NSAP Guidelines', state: 'central' },
  { category: 'corruption_misconduct', law: 'Prevention of Corruption Act, 1988', summary: 'Demanding or accepting bribe by a public servant is punishable with imprisonment up to 7 years.', sla: 14, section: 'Section 7', state: 'central' },
  { category: 'building_construction', law: 'Delhi Development Act, 1957', summary: 'No construction without sanctioned building plan. Illegal construction can be demolished by DDA.', sla: 14, section: 'Section 29', state: 'delhi' },
  { category: 'parks_public_spaces', law: 'Delhi Parks and Gardens Society Act', summary: 'Parks and public spaces must be maintained by local bodies. Citizens can demand accountability.', sla: 7, section: 'Various', state: 'delhi' },
];

// =============================================================================
// Helpers
// =============================================================================

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randomInt(6, 22), randomInt(0, 59), 0, 0);
  return d;
}

function generateComplaintNumber(index: number): string {
  const num = String(index + 1).padStart(5, '0');
  return `JSA-2026-DEL-${num}`;
}

// =============================================================================
// Main Seed Function
// =============================================================================

async function seed() {
  console.log('\n  JanSunwai AI — Demo Data Seeder');
  console.log('  ================================\n');

  // 1. Create Wards
  console.log('  [1/7] Creating 12 wards...');
  const wardIds: string[] = [];
  for (const ward of WARDS) {
    const existing = await prisma.wards.findUnique({ where: { number: ward.number } });
    if (existing) {
      wardIds.push(existing.id);
    } else {
      const w = await prisma.wards.create({
        data: { name: ward.name, number: ward.number, zone: ward.zone },
      });
      wardIds.push(w.id);
    }
  }
  console.log(`         ${wardIds.length} wards ready.`);

  // 2. Create Departments
  console.log('  [2/7] Creating departments...');
  const deptMap: Record<string, string> = {};
  const deptIds: string[] = [];
  for (const dept of DEPARTMENTS) {
    const existing = await prisma.departments.findUnique({ where: { name: dept.name } });
    if (existing) {
      deptIds.push(existing.id);
      dept.categories.forEach((c) => { deptMap[c] = existing.id; });
    } else {
      const d = await prisma.departments.create({
        data: {
          name: dept.name,
          category_mapping: dept.categories as any[],
        },
      });
      deptIds.push(d.id);
      dept.categories.forEach((c) => { deptMap[c] = d.id; });
    }
  }
  console.log(`         ${deptIds.length} departments ready.`);

  // 3. Create Officers (2 per department)
  console.log('  [3/7] Creating officers...');
  const passwordHash = await bcrypt.hash('officer123', 10);
  const officerIds: string[] = [];

  for (let i = 0; i < deptIds.length; i++) {
    const deptId = deptIds[i];
    const name1 = OFFICER_NAMES[i * 2] || `Officer ${i * 2 + 1}`;
    const name2 = OFFICER_NAMES[i * 2 + 1] || `Officer ${i * 2 + 2}`;
    const email1 = name1.toLowerCase().replace(/\s+/g, '.') + '@jansunwai.gov.in';
    const email2 = name2.toLowerCase().replace(/\s+/g, '.') + '@jansunwai.gov.in';

    for (const [name, email, role] of [[name1, email1, 'ward_officer'], [name2, email2, 'department_head']] as const) {
      const existing = await prisma.officers.findUnique({ where: { email } });
      if (existing) {
        officerIds.push(existing.id);
      } else {
        const o = await prisma.officers.create({
          data: {
            name,
            email,
            phone: `98${randomInt(10000000, 99999999)}`,
            department_id: deptId,
            ward_id: randomFrom(wardIds),
            role: role as any,
            password_hash: passwordHash,
          },
        });
        officerIds.push(o.id);
      }
    }
  }
  console.log(`         ${officerIds.length} officers ready. Password: officer123`);

  // 4. Create Citizens
  console.log('  [4/7] Creating citizens...');
  const citizenIds: string[] = [];
  for (const c of CITIZEN_DATA) {
    const existing = await prisma.citizens.findUnique({ where: { phone: c.phone } });
    if (existing) {
      citizenIds.push(existing.id);
    } else {
      const citizen = await prisma.citizens.create({
        data: {
          name: c.name,
          phone: c.phone,
          preferred_language: c.lang,
          ward_id: randomFrom(wardIds),
          vulnerability_flags: c.vuln as any[],
        },
      });
      citizenIds.push(citizen.id);
    }
  }
  console.log(`         ${citizenIds.length} citizens ready.`);

  // 5. Create Legal Rights
  console.log('  [5/7] Creating legal rights data...');
  let legalCount = 0;
  for (const lr of LEGAL_RIGHTS_DATA) {
    const existing = await prisma.legal_rights.findFirst({
      where: { law_name: lr.law },
    });
    if (!existing) {
      await prisma.legal_rights.create({
        data: {
          category: lr.category as any,
          law_name: lr.law,
          summary: lr.summary,
          sla_days: lr.sla,
          source_section: lr.section,
          state: lr.state,
        },
      });
      legalCount++;
    }
  }
  console.log(`         ${legalCount} legal rights entries created.`);

  // 6. Create Grievances
  console.log('  [6/7] Creating 142 grievances...');

  const categories = Object.keys(GRIEVANCE_TEMPLATES);
  const statuses = ['open', 'acknowledged', 'in_progress', 'resolved', 'escalated', 'reopened'];
  // Distribution: 25 open, 20 acknowledged, 30 in_progress, 40 resolved, 20 escalated, 7 reopened = 142
  const statusDistribution = [
    ...Array(25).fill('open'),
    ...Array(20).fill('acknowledged'),
    ...Array(30).fill('in_progress'),
    ...Array(40).fill('resolved'),
    ...Array(20).fill('escalated'),
    ...Array(7).fill('reopened'),
  ];

  // Shuffle
  for (let i = statusDistribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statusDistribution[i], statusDistribution[j]] = [statusDistribution[j], statusDistribution[i]];
  }

  let grievanceCount = 0;
  for (let i = 0; i < 142; i++) {
    const category = categories[i % categories.length];
    const templates = GRIEVANCE_TEMPLATES[category];
    const description = templates.descriptions[i % templates.descriptions.length];
    const subCategory = randomFrom(templates.subCategories);
    const status = statusDistribution[i];
    const citizenId = randomFrom(citizenIds);
    const wardId = randomFrom(wardIds);
    const deptId = deptMap[category] || randomFrom(deptIds);
    const officerId = randomFrom(officerIds);
    const severityScore = status === 'escalated' ? randomInt(70, 95) : randomInt(20, 90);
    const escalationLevel = status === 'escalated' ? randomInt(2, 5) : status === 'reopened' ? randomInt(2, 4) : randomInt(0, 2);
    const filedDaysAgo = randomInt(1, 60);
    const createdAt = daysAgo(filedDaysAgo);
    const resolvedAt = status === 'resolved' ? daysAgo(randomInt(0, filedDaysAgo - 1)) : null;
    const complaintNumber = generateComplaintNumber(i);
    const channel = randomFrom(['web', 'voice', 'whatsapp'] as const);

    // Delhi coordinates (roughly 28.5°N - 28.8°N, 77.0°E - 77.4°E)
    const lat = 28.5 + Math.random() * 0.3;
    const lng = 77.0 + Math.random() * 0.4;

    const addresses = [
      'Block A, Sector 5, Dwarka, New Delhi',
      'H-15, Rajouri Garden, New Delhi - 110027',
      'Old Chandni Chowk Road, near Jama Masjid',
      'Nehru Place, C Block, South Delhi',
      'Rohini Sector 7, near Metro Station',
      'Lajpat Nagar II, Main Market Road',
      'Vasant Kunj, B-5 Pocket, New Delhi',
      'Karol Bagh, DB Gupta Road',
      'Shahdara, East Delhi, near Gandhi Nagar',
      'Mayur Vihar Phase 1, Pocket 2',
      'Connaught Place, Inner Circle',
      'Sadar Bazaar, near Gurudwara Road',
    ];

    try {
      const grievance = await prisma.grievances.create({
        data: {
          complaint_number: complaintNumber,
          citizen_id: citizenId,
          category: category as any,
          sub_category: subCategory,
          description,
          address: randomFrom(addresses),
          ward_id: wardId,
          severity_score: severityScore,
          status: status as any,
          channel: channel as any,
          language: randomFrom(['hi', 'en']),
          assigned_department_id: deptId,
          assigned_officer_id: officerId,
          escalation_level: escalationLevel,
          resolution_verified: status === 'resolved' ? Math.random() > 0.4 : false,
          satisfaction_score: status === 'resolved' ? randomInt(2, 5) : null,
          legal_rights_summary: `Under ${LEGAL_RIGHTS_DATA.find((l) => l.category === category)?.law || 'applicable law'}, you have the right to timely resolution. SLA: ${LEGAL_RIGHTS_DATA.find((l) => l.category === category)?.sla || 7} days.`,
          created_at: createdAt,
          resolved_at: resolvedAt,
        },
      });

      // Create timeline entries
      const timelineEntries: any[] = [
        {
          grievance_id: grievance.id,
          event_type: 'filed',
          description: `Complaint filed via ${channel} channel`,
          actor: 'system',
          created_at: createdAt,
        },
      ];

      if (['acknowledged', 'in_progress', 'resolved', 'escalated', 'reopened'].includes(status)) {
        timelineEntries.push({
          grievance_id: grievance.id,
          event_type: 'acknowledged',
          description: `Complaint acknowledged by ${OFFICER_NAMES[i % OFFICER_NAMES.length]}`,
          actor: OFFICER_NAMES[i % OFFICER_NAMES.length],
          created_at: daysAgo(filedDaysAgo - 1),
        });
      }

      if (['in_progress', 'resolved', 'escalated', 'reopened'].includes(status)) {
        timelineEntries.push({
          grievance_id: grievance.id,
          event_type: 'assigned',
          description: `Assigned to ${OFFICER_NAMES[(i + 1) % OFFICER_NAMES.length]}`,
          actor: 'system',
          created_at: daysAgo(filedDaysAgo - 2),
        });
      }

      if (status === 'escalated') {
        timelineEntries.push({
          grievance_id: grievance.id,
          event_type: 'escalated',
          description: `Escalated to Level ${escalationLevel} due to SLA breach`,
          actor: 'escalation_engine',
          created_at: daysAgo(randomInt(1, filedDaysAgo - 2)),
        });
      }

      if (status === 'resolved') {
        timelineEntries.push({
          grievance_id: grievance.id,
          event_type: 'resolved',
          description: 'Issue has been resolved. Work completed on site.',
          actor: OFFICER_NAMES[(i + 2) % OFFICER_NAMES.length],
          metadata: { notes: 'Team visited the site and completed the repair work. Issue verified by field inspector.' },
          created_at: resolvedAt || daysAgo(1),
        });
      }

      if (status === 'reopened') {
        timelineEntries.push({
          grievance_id: grievance.id,
          event_type: 'resolved',
          description: 'Issue marked as resolved.',
          actor: OFFICER_NAMES[(i + 2) % OFFICER_NAMES.length],
          created_at: daysAgo(randomInt(3, filedDaysAgo - 2)),
        });
        timelineEntries.push({
          grievance_id: grievance.id,
          event_type: 'reopened',
          description: 'Citizen rejected resolution. Issue still persists.',
          actor: 'citizen',
          created_at: daysAgo(randomInt(1, 3)),
        });
      }

      await prisma.grievance_timeline.createMany({ data: timelineEntries });
      grievanceCount++;
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Duplicate complaint number, skip
        continue;
      }
      console.error(`  Error creating grievance ${i}:`, err.message);
    }
  }
  console.log(`         ${grievanceCount} grievances created with timelines.`);

  // 7. Update citizen complaint counts
  console.log('  [7/7] Updating citizen complaint counts...');
  for (const citizenId of citizenIds) {
    const count = await prisma.grievances.count({ where: { citizen_id: citizenId } });
    await prisma.citizens.update({
      where: { id: citizenId },
      data: { total_complaints: count },
    });
  }
  console.log('         Done.\n');

  console.log('  ================================');
  console.log('  Seed data created successfully!');
  console.log('  ================================');
  console.log(`  Wards: ${wardIds.length}`);
  console.log(`  Departments: ${deptIds.length}`);
  console.log(`  Officers: ${officerIds.length}`);
  console.log(`  Citizens: ${citizenIds.length}`);
  console.log(`  Grievances: ${grievanceCount}`);
  console.log(`  Legal Rights: ${LEGAL_RIGHTS_DATA.length} entries`);
  console.log();
  console.log('  Demo login credentials:');
  console.log('  Email: rajesh.kumar@jansunwai.gov.in');
  console.log('  Password: officer123');
  console.log();
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
