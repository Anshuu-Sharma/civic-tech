import { PrismaClient, GrievanceCategory, OfficerRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  // ===========================================================================
  // 1. Wards (12 Delhi wards)
  // ===========================================================================
  console.log('Creating wards...');

  const wardsData = [
    { name: 'Connaught Place', number: 1, zone: 'Central Delhi', center: { lat: 28.6315, lng: 77.2167 } },
    { name: 'Karol Bagh', number: 2, zone: 'Central Delhi', center: { lat: 28.6519, lng: 77.1909 } },
    { name: 'Chandni Chowk', number: 3, zone: 'North Delhi', center: { lat: 28.6506, lng: 77.2303 } },
    { name: 'Dwarka', number: 4, zone: 'South West Delhi', center: { lat: 28.5921, lng: 77.0460 } },
    { name: 'Rohini', number: 5, zone: 'North West Delhi', center: { lat: 28.7495, lng: 77.0565 } },
    { name: 'Saket', number: 6, zone: 'South Delhi', center: { lat: 28.5245, lng: 77.2066 } },
    { name: 'Lajpat Nagar', number: 7, zone: 'South Delhi', center: { lat: 28.5700, lng: 77.2373 } },
    { name: 'Janakpuri', number: 8, zone: 'West Delhi', center: { lat: 28.6219, lng: 77.0810 } },
    { name: 'Pitampura', number: 9, zone: 'North West Delhi', center: { lat: 28.7013, lng: 77.1319 } },
    { name: 'Vasant Kunj', number: 10, zone: 'South West Delhi', center: { lat: 28.5195, lng: 77.1580 } },
    { name: 'Nehru Place', number: 11, zone: 'South Delhi', center: { lat: 28.5491, lng: 77.2533 } },
    { name: 'Shahdara', number: 12, zone: 'East Delhi', center: { lat: 28.6738, lng: 77.2890 } },
  ];

  const wards: Record<string, string> = {};
  for (const w of wardsData) {
    const d = 0.01;
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO wards (id, name, number, zone, boundary)
      VALUES (
        gen_random_uuid(),
        ${w.name},
        ${w.number},
        ${w.zone},
        ST_GeomFromText(
          ${`POLYGON((${w.center.lng - d} ${w.center.lat - d}, ${w.center.lng + d} ${w.center.lat - d}, ${w.center.lng + d} ${w.center.lat + d}, ${w.center.lng - d} ${w.center.lat + d}, ${w.center.lng - d} ${w.center.lat - d}))`},
          4326
        )
      )
      ON CONFLICT (name) DO UPDATE SET zone = EXCLUDED.zone
      RETURNING id::text
    `;
    wards[w.name] = result[0].id;
    console.log(`  Ward: ${w.name} (${result[0].id})`);
  }

  // ===========================================================================
  // 2. Departments (8 departments)
  // ===========================================================================
  console.log('\nCreating departments...');

  const departmentsData = [
    { name: 'Water Supply', categories: [GrievanceCategory.water_supply] },
    { name: 'Electricity', categories: [GrievanceCategory.electricity] },
    { name: 'Roads & Infrastructure', categories: [GrievanceCategory.roads_potholes, GrievanceCategory.building_construction] },
    { name: 'Sanitation', categories: [GrievanceCategory.sanitation_garbage, GrievanceCategory.parks_public_spaces] },
    { name: 'Drainage', categories: [GrievanceCategory.drainage_sewage] },
    { name: 'Street Lighting', categories: [GrievanceCategory.street_lighting] },
    { name: 'Public Transport', categories: [GrievanceCategory.public_transport] },
    { name: 'Revenue & Welfare', categories: [GrievanceCategory.ration_card_pds, GrievanceCategory.pension_welfare, GrievanceCategory.corruption_misconduct] },
  ];

  const departments: Record<string, string> = {};
  for (const dept of departmentsData) {
    const created = await prisma.departments.upsert({
      where: { name: dept.name },
      update: { category_mapping: dept.categories },
      create: { name: dept.name, category_mapping: dept.categories },
    });
    departments[dept.name] = created.id;
    console.log(`  Department: ${dept.name} (${created.id})`);
  }

  // ===========================================================================
  // 3. Officers (24 officers: 1 head + 2 ward officers per department)
  // ===========================================================================
  console.log('\nCreating officers...');

  const dummyHash = '$2b$10$placeholder_hash_for_seed_data_only';
  const wardNames = Object.keys(wards);
  let wardIndex = 0;

  for (const [deptName, deptId] of Object.entries(departments)) {
    const deptSlug = deptName.toLowerCase().replace(/[^a-z]/g, '');

    const head = await prisma.officers.upsert({
      where: { email: `head.${deptSlug}@jansunwai.gov.in` },
      update: {},
      create: {
        name: `Head - ${deptName}`,
        department_id: deptId,
        ward_id: null,
        role: OfficerRole.department_head,
        email: `head.${deptSlug}@jansunwai.gov.in`,
        phone: `+91900000${String(wardIndex).padStart(4, '0')}`,
        password_hash: dummyHash,
      },
    });
    console.log(`  Officer (Head): ${head.name} - ${head.email}`);

    await prisma.departments.update({
      where: { id: deptId },
      data: { head_officer_id: head.id },
    });

    for (let i = 0; i < 2; i++) {
      const wardName = wardNames[wardIndex % wardNames.length];
      const officer = await prisma.officers.upsert({
        where: { email: `officer${wardIndex + 1}.${deptSlug}@jansunwai.gov.in` },
        update: {},
        create: {
          name: `Officer ${wardIndex + 1} - ${deptName}`,
          department_id: deptId,
          ward_id: wards[wardName],
          role: OfficerRole.ward_officer,
          email: `officer${wardIndex + 1}.${deptSlug}@jansunwai.gov.in`,
          phone: `+91900001${String(wardIndex).padStart(4, '0')}`,
          password_hash: dummyHash,
        },
      });
      console.log(`  Officer (Ward): ${officer.name} - ${wardName} - ${officer.email}`);
      wardIndex++;
    }
  }

  // ===========================================================================
  // 4. Legal Rights
  // ===========================================================================
  console.log('\nCreating legal rights entries...');

  // Delete existing to avoid duplicates on re-seed
  await prisma.legal_rights.deleteMany({});

  const legalRightsData = [
    { category: GrievanceCategory.water_supply, law_name: 'Delhi Jal Board Act, 1998', summary: 'The Delhi Jal Board is mandated to provide adequate and clean drinking water to all residents. Citizens have the right to file complaints about water supply disruptions, contamination, or billing disputes.', sla_days: 7, source_section: 'Section 9 - Duties of the Board', state: 'delhi' },
    { category: GrievanceCategory.water_supply, law_name: 'Right to Public Services Act (Delhi)', summary: 'New water connection applications must be processed within 15 days. Repair of water mains and pipelines must begin within 48 hours of complaint.', sla_days: 15, source_section: 'Schedule - Water Supply Services', state: 'delhi' },
    { category: GrievanceCategory.electricity, law_name: 'Electricity Act, 2003', summary: 'Every consumer has the right to receive electricity supply of specified standards. The distribution licensee must restore supply within 24 hours in urban areas.', sla_days: 3, source_section: 'Section 57 - Standards of Performance', state: 'central' },
    { category: GrievanceCategory.electricity, law_name: 'Delhi Electricity Regulatory Commission (Standards of Performance) Regulations', summary: 'Power outages exceeding 2 hours in urban areas must be compensated. New connection must be provided within 7 days for domestic consumers.', sla_days: 7, source_section: 'Regulation 8 - Supply Interruption Standards', state: 'delhi' },
    { category: GrievanceCategory.roads_potholes, law_name: 'Delhi Municipal Corporation Act, 1957', summary: 'The Municipal Corporation is responsible for maintenance and repair of all public roads. Potholes on arterial roads must be repaired within 48 hours of reporting.', sla_days: 7, source_section: 'Section 326 - Roads and Streets', state: 'delhi' },
    { category: GrievanceCategory.roads_potholes, law_name: 'Motor Vehicles Act, 2019', summary: 'Road authorities can be held liable for accidents caused by poorly maintained roads. Citizens can claim compensation for vehicle damage due to potholes.', sla_days: 30, source_section: 'Section 198A - Liability of Contractors and Road Authorities', state: 'central' },
    { category: GrievanceCategory.sanitation_garbage, law_name: 'Solid Waste Management Rules, 2016', summary: 'Every municipal authority must ensure door-to-door collection of segregated waste. Failure to collect garbage for more than 2 consecutive days is a violation.', sla_days: 3, source_section: 'Rule 15 - Duties of Local Authorities', state: 'central' },
    { category: GrievanceCategory.sanitation_garbage, law_name: 'Delhi Municipal Corporation Act, 1957', summary: 'The Corporation must clean and clear garbage from all public places daily. Citizens can file complaints about overflowing garbage bins, open dumping, and stray cattle in garbage areas.', sla_days: 2, source_section: 'Section 352 - Removal of Refuse', state: 'delhi' },
    { category: GrievanceCategory.drainage_sewage, law_name: 'Delhi Jal Board Act, 1998', summary: 'The Board is responsible for sewage disposal and drainage. Blocked drains and sewage overflow must be addressed within 24 hours during monsoon season.', sla_days: 3, source_section: 'Section 9(c) - Drainage Functions', state: 'delhi' },
    { category: GrievanceCategory.drainage_sewage, law_name: 'National Green Tribunal Act, 2010', summary: 'Untreated sewage discharge into water bodies is a violation. Citizens can file complaints with the NGT for environmental damage from drainage failures.', sla_days: 14, source_section: 'Section 14 - Tribunal Jurisdiction', state: 'central' },
    { category: GrievanceCategory.street_lighting, law_name: 'Delhi Municipal Corporation Act, 1957', summary: 'The Corporation must provide and maintain adequate street lighting on all public roads. Non-functional street lights must be repaired within 3 working days.', sla_days: 5, source_section: 'Section 327 - Lighting of Streets', state: 'delhi' },
    { category: GrievanceCategory.public_transport, law_name: 'Motor Vehicles Act, 2019', summary: 'Public transport vehicles must maintain safety standards. Citizens can report overloading, dangerous driving, and route deviations of DTC buses.', sla_days: 7, source_section: 'Section 93 - Duties of Operators', state: 'central' },
    { category: GrievanceCategory.ration_card_pds, law_name: 'National Food Security Act, 2013', summary: 'Every eligible household has the right to receive subsidized foodgrains. If ration is not provided, the state government must pay food security allowance. New ration cards must be issued within 30 days.', sla_days: 15, source_section: 'Section 3, 8 - Right to Foodgrains', state: 'central' },
    { category: GrievanceCategory.ration_card_pds, law_name: 'Right to Public Services Act (Delhi)', summary: 'Ration card applications (new, modification, deletion) must be processed within specified timelines. Complaints about fair price shop dealers must be resolved within 15 days.', sla_days: 15, source_section: 'Schedule - Food & Supply Services', state: 'delhi' },
    { category: GrievanceCategory.pension_welfare, law_name: 'Delhi Old Age Pension Scheme / Widow Pension Scheme', summary: 'Eligible citizens (BPL, 60+ age for old age; widows of any age for widow pension) have the right to monthly pension. Applications must be processed within 30 days.', sla_days: 30, source_section: 'Scheme Guidelines - Eligibility and Disbursement', state: 'delhi' },
    { category: GrievanceCategory.corruption_misconduct, law_name: 'Prevention of Corruption Act, 1988 (Amended 2018)', summary: 'Demanding or accepting bribes by public servants is a criminal offense. Citizens can file complaints with the Anti-Corruption Bureau.', sla_days: 14, source_section: 'Section 7 - Offences relating to public servant', state: 'central' },
    { category: GrievanceCategory.corruption_misconduct, law_name: 'Right to Information Act, 2005', summary: 'Citizens can file RTI applications to obtain information about government decisions, expenditures, and officer conduct. Information must be provided within 30 days.', sla_days: 30, source_section: 'Section 7 - Disposal of Request', state: 'central' },
    { category: GrievanceCategory.building_construction, law_name: 'Delhi Development Act, 1957', summary: 'All construction must comply with building bylaws. Citizens can report illegal constructions, encroachments, and unsafe structures. The DDA must inspect within 7 days.', sla_days: 14, source_section: 'Section 29 - Control of Development', state: 'delhi' },
    { category: GrievanceCategory.parks_public_spaces, law_name: 'Delhi Municipal Corporation Act, 1957', summary: 'The Corporation must maintain parks, gardens, and public open spaces. Citizens can report damaged playground equipment, overgrown vegetation, and encroachment.', sla_days: 10, source_section: 'Section 332 - Public Parks and Gardens', state: 'delhi' },
  ];

  for (const lr of legalRightsData) {
    const created = await prisma.legal_rights.create({ data: lr });
    console.log(`  Legal Right: [${lr.category}] ${lr.law_name} (${created.id})`);
  }

  // ===========================================================================
  // Summary
  // ===========================================================================
  const wardCount = await prisma.wards.count();
  const deptCount = await prisma.departments.count();
  const officerCount = await prisma.officers.count();
  const legalCount = await prisma.legal_rights.count();

  console.log('\n========================================');
  console.log('Seed complete!');
  console.log(`  Wards:        ${wardCount}`);
  console.log(`  Departments:  ${deptCount}`);
  console.log(`  Officers:     ${officerCount}`);
  console.log(`  Legal Rights: ${legalCount}`);
  console.log('========================================\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Seed failed:', e);
    prisma.$disconnect();
    process.exit(1);
  });
