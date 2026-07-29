import type { SnowRate } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

interface MaterialQuantities {
  bulkSaltYards: number;
  iceMelterBags: number;
  calciumChlorideBags: number;
}

interface CostResult {
  bulkSaltCost: Decimal;
  iceMelterCost: Decimal;
  calciumCost: Decimal;
  employeeCost: Decimal;
  fuelCost: Decimal;
  totalDirect: Decimal;
  totalIndirect: Decimal;
}

export function computeSiteServiceCosts(
  quantities: MaterialQuantities,
  rates: SnowRate,
  durationHours: number,
  crewSize: number
): CostResult {
  const bulkSaltCost = new Decimal(quantities.bulkSaltYards).mul(
    rates.bulkSaltPerYard
  );
  const iceMelterCost = new Decimal(quantities.iceMelterBags).mul(
    rates.iceMelterPerBag
  );
  const calciumCost = new Decimal(quantities.calciumChlorideBags).mul(
    rates.calciumPerBag
  );
  const employeeCost = new Decimal(durationHours)
    .mul(crewSize)
    .mul(rates.employeePerHour);
  const fuelCost = new Decimal(durationHours).mul(rates.fuelPerHour);

  const totalDirect = bulkSaltCost
    .add(iceMelterCost)
    .add(calciumCost)
    .add(employeeCost)
    .add(fuelCost);

  const totalIndirect = totalDirect.mul(rates.indirectMultiplier);

  return {
    bulkSaltCost,
    iceMelterCost,
    calciumCost,
    employeeCost,
    fuelCost,
    totalDirect,
    totalIndirect,
  };
}
