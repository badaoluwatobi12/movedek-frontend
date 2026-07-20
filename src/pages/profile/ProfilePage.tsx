import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { store, useSession, useStore } from "@/data/store";
import { getStoredAuthUser } from "@/lib/authStorage";
import type { User } from "@/lib/types";
import { profileService, type ProfileUpdate } from "@/services/profile.service";

const defaults = {
  email: true,
  sms: true,
  push: true,
  delivery_updates: true,
  promotions: false,
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const session = useSession();
  const stored = getStoredAuthUser();
  const storeUser = useStore((state) =>
    state.users.find((user) => user.id === session?.userId),
  );
  const initial = (storeUser ?? stored) as User | null;
  const [user, setUser] = useState<User | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [form, setForm] = useState<ProfileUpdate>({
    full_name: initial?.full_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    avatar_url: initial?.avatar_url ?? "",
    bio: initial?.bio ?? "",
    location: initial?.location ?? "",
    timezone:
      initial?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: initial?.language ?? "en",
    notification_preferences: {
      ...defaults,
      ...(initial?.notification_preferences ?? {}),
    },
  });

  useEffect(() => {
    let mounted = true;
    profileService
      .get()
      .then((profile) => {
        if (!mounted) return;
        setUser(profile);
        setForm({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url ?? "",
          bio: profile.bio ?? "",
          location: profile.location ?? "",
          timezone:
            profile.timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: profile.language ?? "en",
          notification_preferences: {
            ...defaults,
            ...(profile.notification_preferences ?? {}),
          },
        });
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const initials = useMemo(
    () =>
      (form.full_name || "MoveDek User")
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [form.full_name],
  );

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await profileService.update(form);
      setUser(updated);
      await store.refresh();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE")
      return toast.error('Type "DELETE" exactly to confirm');
    setDeleting(true);
    try {
      await profileService.deleteAccount(
        deletePassword,
        deleteConfirmation,
        deleteReason,
      );
      store.logout();
      toast.success("Your MoveDek account has been deleted");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete account",
      );
    } finally {
      setDeleting(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword)
      return toast.error("New passwords do not match");
    setChangingPassword(true);
    try {
      await profileService.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not change password",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your identity, contact details, security, and communication preferences."
      />

      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/90 via-primary to-accent" />
        <CardContent className="relative flex flex-col gap-4 pb-6 pt-0 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative -mt-12 w-fit">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                <AvatarImage
                  src={form.avatar_url || undefined}
                  alt={form.full_name}
                />
                <AvatarFallback className="text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">
                  {form.full_name || "MoveDek User"}
                </h2>
                <Badge className="capitalize">{user?.role}</Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />{" "}
                  {user?.status ?? "active"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Member since{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
          <Button onClick={saveProfile} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            changes
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>
                  Information shown across your MoveDek workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Full name"
                  icon={<UserRound className="h-4 w-4" />}
                >
                  <Input
                    value={form.full_name}
                    onChange={(event) =>
                      setForm({ ...form, full_name: event.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Email address"
                  icon={<Mail className="h-4 w-4" />}
                >
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Phone number"
                  icon={<Phone className="h-4 w-4" />}
                >
                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                  />
                </Field>
                <Field label="Location" icon={<MapPin className="h-4 w-4" />}>
                  <Input
                    placeholder="Lagos, Nigeria"
                    value={form.location ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, location: event.target.value })
                    }
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Label htmlFor="avatar">Profile photo URL</Label>
                  <Input
                    id="avatar"
                    className="mt-2"
                    placeholder="https://..."
                    value={form.avatar_url ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, avatar_url: event.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    className="mt-2"
                    rows={4}
                    maxLength={300}
                    placeholder="Tell people a little about you..."
                    value={form.bio ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, bio: event.target.value })
                    }
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {form.bio?.length ?? 0}/300
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Account overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <Summary label="Account role" value={user?.role ?? "—"} />
                <Summary
                  label="Account status"
                  value={user?.status ?? "active"}
                />
                <Summary label="User ID" value={user?.id ?? "—"} mono />
                <div className="rounded-xl border bg-muted/30 p-4">
                  <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
                  <p className="font-medium">Protected account</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Changes are authenticated and recorded in the audit log.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Regional preferences</CardTitle>
                <CardDescription>
                  Customize language and time display.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Language</Label>
                  <Select
                    value={form.language}
                    onValueChange={(value: "en" | "fr" | "pt") =>
                      setForm({ ...form, language: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input
                    className="mt-2"
                    value={form.timezone ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, timezone: event.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Choose how MoveDek keeps you informed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {(
                  [
                    ["email", "Email notifications"],
                    ["sms", "SMS notifications"],
                    ["push", "Push notifications"],
                    ["delivery_updates", "Delivery updates"],
                    ["promotions", "Product news and offers"],
                  ] as const
                ).map(([key, label]) => (
                  <Preference
                    key={key}
                    label={label}
                    checked={Boolean(form.notification_preferences?.[key])}
                    onChange={(checked) =>
                      setForm({
                        ...form,
                        notification_preferences: {
                          ...form.notification_preferences,
                          [key]: checked,
                        },
                      })
                    }
                  />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveProfile} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
              preferences
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Change password
              </CardTitle>
              <CardDescription>
                Use at least 12 characters with uppercase, lowercase, number,
                and symbol.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  className="mt-2"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  className="mt-2"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  className="mt-2"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <Button
                onClick={changePassword}
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {changingPassword && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update password
              </Button>
            </CardContent>
          </Card>

          <Card className="max-w-2xl border-destructive/35">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger zone
              </CardTitle>
              <CardDescription>
                Account deletion permanently disables access and removes your personal profile information. Active deliveries and wallet balances must be resolved first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your MoveDek account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your profile will be anonymized, your credentials removed, and every active session revoked.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label htmlFor="delete-password">Current password</Label>
                      <Input id="delete-password" type="password" className="mt-2" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="delete-confirmation">Type DELETE to confirm</Label>
                      <Input id="delete-confirmation" className="mt-2" autoComplete="off" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="delete-reason">Reason for leaving (optional)</Label>
                      <Textarea id="delete-reason" className="mt-2" maxLength={500} value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Keep account</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(event) => { event.preventDefault(); void deleteAccount(); }}
                      disabled={deleting || !deletePassword || deleteConfirmation !== "DELETE"}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Permanently delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Summary({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`max-w-[60%] text-right capitalize ${mono ? "font-mono text-xs normal-case" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}
function Preference({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-1 py-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
