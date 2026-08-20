import { isToday, isYesterday, isWithinInterval, subDays, startOfDay } from "date-fns";
import type { ConversationSummary } from "@/types";

export type ConversationGroupLabel =
  | "Today"
  | "Yesterday"
  | "Previous 7 Days"
  | "Previous 30 Days"
  | "Older";

export interface ConversationGroup {
  label: ConversationGroupLabel;
  items: ConversationSummary[];
}

const GROUP_ORDER: ConversationGroupLabel[] = [
  "Today",
  "Yesterday",
  "Previous 7 Days",
  "Previous 30 Days",
  "Older",
];

/**
 * Buckets conversations by `updatedAt` into the classic
 * Today / Yesterday / Previous 7 Days / Previous 30 Days / Older groups,
 * preserving the incoming (already most-recent-first) order within each group.
 */
export function groupConversationsByDate(
  conversations: ConversationSummary[],
): ConversationGroup[] {
  const now = new Date();
  const sevenDaysAgo = startOfDay(subDays(now, 7));
  const thirtyDaysAgo = startOfDay(subDays(now, 30));

  const buckets: Record<ConversationGroupLabel, ConversationSummary[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    "Previous 30 Days": [],
    Older: [],
  };

  for (const conversation of conversations) {
    const date = new Date(conversation.updatedAt);

    if (isToday(date)) {
      buckets.Today.push(conversation);
    } else if (isYesterday(date)) {
      buckets.Yesterday.push(conversation);
    } else if (isWithinInterval(date, { start: sevenDaysAgo, end: now })) {
      buckets["Previous 7 Days"].push(conversation);
    } else if (isWithinInterval(date, { start: thirtyDaysAgo, end: now })) {
      buckets["Previous 30 Days"].push(conversation);
    } else {
      buckets.Older.push(conversation);
    }
  }

  return GROUP_ORDER.filter((label) => buckets[label].length > 0).map(
    (label) => ({ label, items: buckets[label] }),
  );
}
