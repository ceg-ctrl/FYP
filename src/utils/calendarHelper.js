export const createGoogleCalendarLink = (fd) => {
  const { bankName, principal, maturityDate } = fd;

  // 1. Format the Date for Google (YYYYMMDD)
  // Google requires the format YYYYMMDD for all-day events
  const dateStr = maturityDate.replace(/-/g, ''); 
  
  // The event is all day, so start and end are the same date
  const dates = `${dateStr}/${dateStr}`;

  // 2. Define Event Details
  const title = encodeURIComponent(`💰 FD Maturity: ${bankName}`);
  const details = encodeURIComponent(
    `Your Fixed Deposit at ${bankName} matches today!\n\nPrincipal: RM ${principal}\n\nPlease login to FD Tracker to update.`
  );

  // 3. Construct the URL
  // action=TEMPLATE: Creates a new event
  // tr=true: Sets it as "Available" (Transparent)
  // add=user@email.com: Tries to add to current user
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&sf=true&output=xml`;
};
