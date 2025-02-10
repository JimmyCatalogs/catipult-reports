import { NextApiRequest, NextApiResponse } from 'next';

const BUCKET_URL = 'https://s3.us-east-1.amazonaws.com/catipult.ai/quickmail-reports';

interface Week {
  id: string;
  label: string;
  screenshots: string[];
}

// Hard-coded weeks - newest to oldest (starting from Sundays)
const WEEKS = [
  '02-02-25',
  '01-26-25',
  '01-19-25',
  '01-12-25',
];

function formatDateRange(dateStr: string): string {
  const [month, day, year] = dateStr.split('-');
  const date = new Date(parseInt(`20${year}`), parseInt(month) - 1, parseInt(day));
  
  // Get end of week (Saturday) - since we start on Sunday, add 6 days
  const endDate = new Date(date);
  endDate.setDate(date.getDate() + 5);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${monthNames[date.getMonth()]} ${date.getDate()} - ${monthNames[endDate.getMonth()]} ${endDate.getDate()}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const weeks: Week[] = WEEKS.map(weekId => ({
      id: weekId,
      label: formatDateRange(weekId),
      screenshots: Array.from({ length: 4 }, (_, i) => 
        `${BUCKET_URL}/${weekId}/${i + 1}.PNG`
      )
    }));

    res.status(200).json({ weeks });
  } catch (error) {
    console.error('Error processing weeks:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error processing weeks'
    });
  }
}
