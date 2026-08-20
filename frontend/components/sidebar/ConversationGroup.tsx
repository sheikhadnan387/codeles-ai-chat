import { ConversationItem } from "./ConversationItem";
import type { ConversationGroup as ConversationGroupData } from "@/lib/utils/date";

interface ConversationGroupProps {
  group: ConversationGroupData;
  activeConversationId?: string;
  onNavigate?: () => void;
}

export function ConversationGroup({
  group,
  activeConversationId,
  onNavigate,
}: ConversationGroupProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="px-2.5 pt-3 pb-1 text-xs font-medium text-muted-foreground">
        {group.label}
      </h3>
      {group.items.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeConversationId}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
