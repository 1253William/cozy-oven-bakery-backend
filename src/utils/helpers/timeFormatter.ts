// ✅ Helper to format duration in HH:mm style
export const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
};

// Add a reverse function to parse HH:mm back to milliseconds
export const parseDuration = (duration: string): number => {
  const parts = duration.split("h");    
    const hours = parseInt(parts[0].trim(), 10) || 0;
    const minutes = parseInt(parts[1].replace("m", "").trim(), 10) || 0;
    return (hours * 60 + minutes) * 60 * 1000; // Convert to milliseconds
};
// Example usage:
// console.log(formatDuration(3600000)); // "01h 00m"
// console.log(parseDuration("01h 30m")); // 5400000 (1.5 hours in milliseconds)


//Helper: detect current quarter label (e.g., "Q3-2025")
const getCurrentQuarter = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter}-${year}`;
};
export default getCurrentQuarter;