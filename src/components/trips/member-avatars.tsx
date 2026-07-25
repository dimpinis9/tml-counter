import { UserRound } from "lucide-react";

export type MemberAvatar = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export function MemberAvatars({ members }: { members: MemberAvatar[] }) {
  return (
    <div className="flex -space-x-2" aria-label={`${members.length} trip members`}>
      {members.slice(0, 5).map((member) => (
        <span
          className="grid size-10 place-items-center overflow-hidden rounded-full border-2 border-card bg-muted text-xs font-semibold"
          key={member.userId}
          title={member.displayName}
        >
          {member.avatarUrl ? (
            // External avatar URLs are user-controlled; a plain image avoids
            // requiring an unrestricted Next.js remote image allowlist.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={member.displayName}
              className="size-full object-cover"
              src={member.avatarUrl}
            />
          ) : (
            <UserRound className="size-4 text-muted-foreground" />
          )}
        </span>
      ))}
      {members.length > 5 && (
        <span className="grid size-10 place-items-center rounded-full border-2 border-card bg-foreground text-xs text-background">
          +{members.length - 5}
        </span>
      )}
    </div>
  );
}
