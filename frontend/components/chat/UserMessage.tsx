import { AttachmentChip } from "./AttachmentChip";
import type { Message } from "@/types";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[85%] flex-col items-end gap-1.5 sm:max-w-[75%]">
        {message.attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {message.attachments.map((attachment) => (
              <AttachmentChip key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
        {message.content && (
          <div className="rounded-2xl bg-primary px-4 py-2.5 text-[0.925rem] whitespace-pre-wrap text-primary-foreground">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}
