const mongoose = require('mongoose');
const {
  Dojo,
  Family,
  Parent,
  Grade,
  Title,
  Student
} = require('./mongoose-schemas'); // Adjust path as needed

const uri = 'mongodb://localhost:27017/namGojuKaiDB'; // 'namGojuKaiDB' is your new DB

async function seed() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  try {
    // Clear existing data
    await Promise.all([
      Dojo.deleteMany({}),
      Family.deleteMany({}),
      Parent.deleteMany({}),
      Grade.deleteMany({}),
      Title.deleteMany({}),
      Student.deleteMany({})
    ]);

    // Family
    const family1 = await Family.create({
        familyCode: 'GEY0001',
        familyName: 'Geyser'
    });
    //family
    const family2 = await Family.create({
      familyCode: 'FOU0001',
      familyName: 'Fourie'
    });

    // Parents
    const parent1 = await Parent.create({
      name: 'Lizl Geyser',
      contactEmail: 'lizl@netpayna.com',
      contactPhone: '+264811287610',
      familyId: family1._id,
    });

    const parent2 = await Parent.create({
      name: 'Pewer Fourie',
      contactEmail: 'pewer@emcongroup.com',
      contactPhone: '+264811483983',
      familyId: family2._id,
    });

    // Grade
    const grade1 = await Grade.create({
      description: '8th Kyu - Yellow',
      gradingCost: 200,
        gradingCostCurrency: 'NAD',
    });

    // Grade
    const grade2 = await Grade.create({
      description: '7th Kyu - Orange',
      gradingCost: 200,
      gradingCostCurrency: 'NAD',
    });
    //grade
    const grade3 = await Grade.create({
      description: '6th Kyu - Green',
      gradingCost: 220,
      gradingCostCurrency: 'NAD',
    });
    // Grade
    const grade = await Grade.create({
      description: '5th Kyu - Blue',
      gradingCost: 250,
        gradingCostCurrency: 'NAD',
    });
    // Grade
    const grade4 = await Grade.create({
      description: '4th Kyu - Purple',
      gradingCost: 300,
      gradingCostCurrency: 'NAD',
    });
    // Grade
    const grade5 = await Grade.create({
      description: '3rd Kyu - Brown',
      gradingCost: 400,
      gradingCostCurrency: 'NAD',
    });
    // Grade
    const grade6 = await Grade.create({
      description: '2nd Kyu - Brown',
      gradingCost: 400,
      gradingCostCurrency: 'NAD',
    });
    // Grade
    const grade7 = await Grade.create({
      description: '1st Kyu - Brown',
      gradingCost: 400,
      gradingCostCurrency: 'NAD',
    });
 
    // Grade
    const grade8 = await Grade.create({
      description: 'Shodan',
      gradingCost: 120,
      gradingCostCurrency: 'USD',
    });
    // Grade
    const grade9 = await Grade.create({
      description: 'Nidan',
      gradingCost: 200,
      gradingCostCurrency: 'USD',
    });
    // Grade
    const grade10 = await Grade.create({
      description: 'Sandan',
      gradingCost: 300,
      gradingCostCurrency: 'USD',
    });
    // Grade
    const grade11 = await Grade.create({
      description: 'Yondan',
      gradingCost: 400,
      gradingCostCurrency: 'USD',
    });
    // Grade
    const grade12 = await Grade.create({
      description: 'Godan',
      gradingCost: 500,
      gradingCostCurrency: 'USD',
    });
    // Grade
    const grade13 = await Grade.create({
      description: 'Rokudan',
      gradingCost: 600,
      gradingCostCurrency: 'USD',
    });
    // Grade
    const grade14 = await Grade.create({
      description: 'Nanadan',
      gradingCost: 700,
      gradingCostCurrency: 'USD',
    });
    // Grade
    const grade15 = await Grade.create({
      description: 'Hachidan',
      gradingCost: 800,
      gradingCostCurrency: 'USD',
    });

    // Title
    const title1 = await Title.create({
      description: 'Sempai',
    });
    // Title
    const title2 = await Title.create({
      description: 'Sensei',
    });
    // Title
    const title3 = await Title.create({
      description: 'Shihan',
    });
    // Title
    const title6 = await Title.create({
      description: 'Renshi',
    });
    // Title
    const title5 = await Title.create({
      description: 'Kyoshi',
    });
    // Title
    const title4 = await Title.create({
      description: 'Hanshi',
    });

    // Dojo
    const dojo = await Dojo.create({
      name: 'Windhoek Dojo',
      address: 'Unit 8, Hyper Motor City, Maxwell Street',
      city: 'Windhoek',
      region: 'Khomas',
      country: 'Namibia',
      contactEmail: 'geyserrb@gmail.com',
      contactPhone: '+264811276341',
      instructorId: null, // Placeholder for now
    });

    // Student (will become the instructor)
    const student1 = await Student.create({
      firstName: 'Ryan',
      lastName: 'Geyser',
      dob: new Date('1972-09-02'),
      gender: 'Male',
      weight: 83.5,
      dojoId: dojo._id,
      gradeId: grade13._id,
      titleId: title6._id,
      joinDate: new Date('1992-03-01'),
      lastGraded: new Date('2023-09-15'),
      contactEmail: 'geyserrb@gmail.com',
      contactPhone: '+264811276341',
      familyId: family1._id,
      instructor: true,
      active: true,
    });

    // Student
    const student2 = await Student.create({
      firstName: 'Mikayla',
      lastName: 'Geyser',
      dob: new Date('2008-12-18'),
      gender: 'Female',
      weight: 51.4,
      dojoId: dojo._id,
      gradeId: grade8._id,
      titleId: title1._id,
      joinDate: new Date('2015-01-01'),
      lastGraded: new Date('2022-11-30'),
      contactEmail: 'mikayla.geyser@icloud.com',
      contactPhone: '+264817720799',
      familyId: family1._id,
      parents: [parent1._id],
      instructor: false,
      active: true,
    });
    // Student
    const student3 = await Student.create({
      firstName: 'Ben',
      lastName: 'Fourie',
      dob: new Date('2008-02-04'),
      gender: 'Male',
      weight: 67.8,
      dojoId: dojo._id,
      gradeId: grade7._id,
      joinDate: new Date('2015-01-01'),
      lastGraded: new Date('2017-02-01'),
      familyId: family2._id,
      parents: [parent2._id],
      instructor: false,
      active: true,
    });

    // Update dojo with instructor
    dojo.instructorId = student1._id;
    await dojo.save();

    console.log('✅ Sample data seeded successfully.');
  } catch (err) {
    console.error('❌ Error seeding data:', err);
  } finally {
    mongoose.disconnect();
  }
}

seed();
