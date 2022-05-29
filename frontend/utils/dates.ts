import { toDate, formatDistanceToNow } from "date-fns";

export const formatDate = (dateInSeconds: string) => {
  const toNo = parseInt(dateInSeconds);
  const d = toDate(toNo * 1000);
  return formatDistanceToNow(d, { addSuffix: true });
};
