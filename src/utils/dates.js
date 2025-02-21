// src/utils/dates.js

export function formatUnixTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatFolderDate(date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${month}-${day}-${year}`;
}

export function getWeekRange(sundayDate) {
  const saturday = new Date(sundayDate);
  saturday.setDate(sundayDate.getDate() + 6);
  
  return `${sundayDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })} - ${saturday.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })}`;
}
