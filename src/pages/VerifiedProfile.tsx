import { useAuth } from "@/hooks/useAuth";
import {
  User, Mail, Shield, Clock, LogOut, Loader2
} from "lucide-react";

export default function VerifiedProfile() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const provider = user.app_metadata?.provider || "email";
  const email = user.email || "—";
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0];
  const avatarUrl = user.user_metadata?.avatar_url;
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/30 shadow-glow"
          />
        ) : (
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary shadow-glow shrink-0">
            <User className="w-7 h-7 text-primary-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">Authenticated User Profile</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
        <InfoRow icon={Mail} label="Email" value={email} />
        <InfoRow icon={Shield} label="Auth Provider" value={provider.charAt(0).toUpperCase() + provider.slice(1)} />
        <InfoRow icon={Clock} label="Last Sign In" value={lastSignIn} />
        <InfoRow icon={User} label="User ID" value={user.id.slice(0, 8) + "…"} mono />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </div>
      <span className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
