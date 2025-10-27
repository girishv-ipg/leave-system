export function calculateWorkingDaysInMonth(year, month, holidays = []) {
  let workingDays = 0;
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    const day = date.getDay();
    const dateStr = date.toISOString().slice(0, 10);
    if (day !== 0 && day !== 6 && !holidays.includes(dateStr)) {
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }
  return workingDays;
}

export function getQuarter(month) {
  return Math.floor(month / 3) + 1;
}
