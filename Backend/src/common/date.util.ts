export function getLast30DaysWindow(referenceDate = new Date()) {
  const endDate = new Date(referenceDate);
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - 30);

  return { startDate, endDate };
}
