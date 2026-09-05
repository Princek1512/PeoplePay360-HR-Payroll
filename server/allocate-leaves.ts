import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Starting retroactive leave allocation script...');

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  // Fetch all time off types that require allocation
  const types = await prisma.timeOffType.findMany({
    where: { requiresAllocation: true }
  });

  if (types.length === 0) {
    console.log('❌ No time off types require allocation.');
    return;
  }

  // Define default limits
  const defaultAllocations: Record<string, number> = {
    'Paid Time Off (PTO)': 20.0,
    'Sick / Medical Leave': 10.0
  };

  const employees = await prisma.employee.findMany();
  let allocatedCount = 0;

  for (const emp of employees) {
    for (const type of types) {
      // Check if employee already has an allocation for this type in the current year
      const existing = await prisma.timeOffAllocation.findFirst({
        where: {
          employeeId: emp.id,
          timeOffTypeId: type.id,
          validFrom: { lte: yearEnd },
          validTo: { gte: yearStart }
        }
      });

      if (!existing) {
        // Allocate based on type name, default to 15 if not specified
        const amount = defaultAllocations[type.name] || 15.0;

        await prisma.timeOffAllocation.create({
          data: {
            employeeId: emp.id,
            timeOffTypeId: type.id,
            allocatedAmount: amount,
            takenAmount: 0,
            remainingAmount: amount,
            validFrom: yearStart,
            validTo: yearEnd,
            status: 'approved'
          }
        });

        console.log(`✅ Allocated ${amount} days of '${type.name}' to ${emp.name} (${emp.email})`);
        allocatedCount++;
      }
    }
  }

  console.log(`🎉 Finished! Created ${allocatedCount} new allocations.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
