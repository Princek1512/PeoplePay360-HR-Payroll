import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting leave balance recalculation script...');

  const allocations = await prisma.timeOffAllocation.findMany({
    include: {
      timeOffType: true
    }
  });

  let updatedCount = 0;

  for (const alloc of allocations) {
    // Sum all approved time off requests for this employee and type
    const requests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: alloc.employeeId,
        timeOffTypeId: alloc.timeOffTypeId,
        status: 'approved'
      }
    });

    const actualTaken = requests.reduce((sum, req) => sum + Number(req.durationAmount), 0);
    const allocated = Number(alloc.allocatedAmount);
    const newRemaining = allocated - actualTaken;

    if (Number(alloc.takenAmount) !== actualTaken || Number(alloc.remainingAmount) !== newRemaining) {
      await prisma.timeOffAllocation.update({
        where: { id: alloc.id },
        data: {
          takenAmount: actualTaken,
          remainingAmount: newRemaining
        }
      });
      updatedCount++;
    }
  }

  console.log(`✅ Finished! Recalculated and fixed balances for ${updatedCount} allocations.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
