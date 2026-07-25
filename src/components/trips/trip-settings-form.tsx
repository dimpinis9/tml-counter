"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, Trash2, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InviteMemberForm } from "@/components/trips/invite-member-form";
import {
  deleteTripAction,
  removeMemberAction,
  updateTripAction,
} from "@/features/trips/actions";
import { tripSchema, type TripValues } from "@/lib/validation/trips";

export type SettingsMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: "owner" | "member";
};

export function TripSettingsForm({
  currentUserId,
  initialValues,
  members,
  tripId,
  tripName,
}: {
  currentUserId: string;
  initialValues: TripValues;
  members: SettingsMember[];
  tripId: string;
  tripName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [removingId, setRemovingId] = useState<string>();
  const form = useForm<TripValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(values: TripValues) {
    const result = await updateTripAction(tripId, values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Chapter settings saved.");
    router.refresh();
  }

  async function removeMember(userId: string) {
    setRemovingId(userId);
    const result = await removeMemberAction(tripId, userId);
    setRemovingId(undefined);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Member removed from the chapter.");
    router.refresh();
  }

  async function deleteTrip() {
    setDeleting(true);
    const result = await deleteTripAction(tripId);
    if (!result.success) {
      setDeleting(false);
      toast.error(result.error);
      return;
    }
    toast.success("Chapter deleted.");
    router.replace("/trips");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        className="rounded-[2rem] border border-border bg-card p-5 sm:p-8"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <h2 className="font-display text-4xl">Chapter details</h2>
        <div className="mt-6 space-y-5">
          <Field error={form.formState.errors.name?.message} label="Name">
            <Input {...form.register("name")} />
          </Field>
          <Field
            error={form.formState.errors.description?.message}
            label="Description"
          >
            <Textarea {...form.register("description")} />
          </Field>
          <Field
            error={form.formState.errors.coverPlaceholder?.message}
            label="Cover mood"
          >
            <select
              className="h-12 w-full rounded-xl border border-border bg-background/70 px-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm"
              {...form.register("coverPlaceholder")}
            >
              <option value="sunset">Golden sunset</option>
              <option value="sea">Aegean blue</option>
              <option value="forest">Mountain green</option>
              <option value="night">Night drive</option>
            </select>
          </Field>
        </div>
        <Button className="mt-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {form.formState.isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <section className="rounded-[2rem] border border-border bg-card p-5 sm:p-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              The People of Tomorrow
            </p>
            <h2 className="mt-1 font-display text-4xl">Members</h2>
          </div>
          <span className="text-sm text-muted-foreground">{members.length}</span>
        </div>
        <InviteMemberForm tripId={tripId} />
        <div className="mt-6 divide-y divide-border">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            return (
              <div
                className="flex items-center gap-3 py-4"
                key={member.userId}
              >
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
                  {member.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={member.displayName}
                      className="size-full object-cover"
                      src={member.avatarUrl}
                    />
                  ) : (
                    member.displayName.slice(0, 1).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {member.displayName} {isCurrentUser && "(you)"}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {member.role}
                  </p>
                </div>
                {!isCurrentUser && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        aria-label={`Remove ${member.displayName}`}
                        disabled={removingId === member.userId}
                        size="icon"
                        variant="ghost"
                      >
                        {removingId === member.userId ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <UserMinus className="size-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {member.displayName} will immediately lose access to
                          this private chapter and its future memories.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep member</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMember(member.userId)}
                        >
                          Remove member
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-destructive/25 bg-destructive/5 p-5 sm:p-8">
        <h2 className="font-display text-4xl">Delete this chapter</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          This permanently removes the chapter, memberships, albums, invitations,
          and media records. This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="mt-5 bg-destructive text-white hover:bg-destructive/90">
              <Trash2 className="size-4" /> Delete chapter
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{tripName}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Every private file and dependent database record will be
                permanently deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={deleting} onClick={deleteTrip}>
                {deleting && <LoaderCircle className="size-4 animate-spin" />}
                {deleting ? "Deleting…" : "Yes, delete chapter"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && (
        <span className="block text-xs text-destructive" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
