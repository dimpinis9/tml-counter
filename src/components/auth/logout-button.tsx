import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <Button aria-label="Sign out" size="icon" type="submit" variant="ghost">
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
