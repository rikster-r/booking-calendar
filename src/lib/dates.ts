export function get30DayRange() {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 30); // Add 30 days

  // Format as YYYY-MM-DD
  const start = today.toISOString().split("T")[0];
  const end = futureDate.toISOString().split("T")[0];

  return { start, end };
}