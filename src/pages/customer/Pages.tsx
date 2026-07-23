import { useEffect, useMemo, useState } from "react";
import { useSession, useStore, store } from "@/data/store";
import { PaymentBadge } from "@/components/badges";
import { EmptyState } from "@/components/common";
import { naira, shortDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PaginationBar from "@/components/common/PaginationBar";
import { useClientPagination } from "@/hooks/useClientPagination";
import {
  MapPin,
  Plus,
  LifeBuoy,
  Pencil,
  Trash2,
  Save,
  X,
  Wallet,
  CreditCard,
  User,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useInitializeWalletTopUp, useWallet } from "@/hooks/useWallet";

export function WalletPage() {
  const [amount, setAmount] = useState(5000);
  const initializeTopUp = useInitializeWalletTopUp();
  const walletQuery = useWallet();
  const w = walletQuery.data?.wallet;
  const tx = (walletQuery.data?.transactions ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const topUp = async () => {
    if (!Number.isFinite(amount) || amount < 500)
      return toast.error("Minimum top-up is ₦500");

    try {
      const result = await initializeTopUp.mutateAsync({ amount });
      if (result.authorization_url) {
        toast.success("Redirecting to secure Paystack payment.");
        window.location.assign(result.authorization_url);
        return;
      }
      toast.error("Could not start Paystack payment. Please try again.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not top up wallet",
      );
    }
  };

  const transactionPage = useClientPagination(tx, 15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Wallet</h1>
        <p className="text-sm text-muted-foreground">
          Use wallet balance for delivery escrow payments and refunds.
        </p>
      </div>
      <div className="card-elevated hero-gradient text-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white/80 text-sm">Available balance</div>
            <div className="font-display text-4xl font-bold">
              {naira(w?.balance ?? 0)}
            </div>
          </div>
          <Wallet className="h-10 w-10 text-white/70" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            type="number"
            min={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="bg-white/95 text-foreground"
          />
          <Button
            className="accent-gradient text-white shadow-glow"
            onClick={topUp}
            disabled={initializeTopUp.isPending}
          >
            {initializeTopUp.isPending ? "Processing…" : "Top up wallet"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-white/70">
          Top-ups are funded through Paystack. You'll be redirected to a secure
          checkout page.
        </p>
      </div>
      <div className="card-elevated overflow-hidden">
        <div className="flex items-center gap-2 border-b p-4 font-display font-semibold text-primary">
          <CreditCard className="h-4 w-4" /> Transactions
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tx.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No wallet transactions yet.
                </TableCell>
              </TableRow>
            )}
            {transactionPage.items.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{shortDate(t.created_at)}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell className="capitalize">{t.type}</TableCell>
                <TableCell
                  className={
                    t.type === "credit" ? "text-success" : "text-destructive"
                  }
                >
                  {t.type === "credit" ? "+" : "−"}
                  {naira(t.amount)}
                </TableCell>
                <TableCell>
                  <PaymentBadge
                    status={
                      t.status === "success"
                        ? "paid"
                        : t.status === "pending"
                          ? "pending"
                          : "failed"
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function Addresses() {
  const session = useSession()!;
  const savedAddresses = useStore((s) => s.savedAddresses);
  const saved = savedAddresses.filter((a) => a.user_id === session.userId);
  const [form, setForm] = useState({ label: "", address: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: "", address: "" });
  const canSave = useMemo(
    () => form.label.trim() && form.address.trim(),
    [form],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return toast.error("Add both label and address");
    store.addAddress({
      user_id: session.userId,
      label: form.label.trim(),
      address: form.address.trim(),
    });
    setForm({ label: "", address: "" });
    toast.success("Address saved");
  };

  const beginEdit = (address: {
    id: string;
    label: string;
    address: string;
  }) => {
    setEditingId(address.id);
    setEditForm({ label: address.label, address: address.address });
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (!editForm.label.trim() || !editForm.address.trim())
      return toast.error("Label and address are required");
    store.updateAddress(editingId, {
      label: editForm.label.trim(),
      address: editForm.address.trim(),
    });
    setEditingId(null);
    toast.success("Address updated");
  };

  const remove = (id: string) => {
    const result = store.removeAddress(id, session.userId);
    if (result.ok) toast.success("Address removed");
    else toast.error(result.message);
  };

  const addressPage = useClientPagination(saved, 12);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">
          Saved addresses
        </h1>
        <p className="text-sm text-muted-foreground">
          Save common pickup and drop-off locations for faster delivery
          creation.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="card-elevated grid gap-3 p-4 sm:grid-cols-[180px_1fr_auto]"
      >
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Home"
          />
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Street, area, city"
          />
        </div>
        <div className="flex items-end">
          <Button className="w-full accent-gradient text-white shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> Save
          </Button>
        </div>
      </form>

      {saved.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          desc="Add your first address above."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addressPage.items.map((s) => (
            <div key={s.id} className="card-elevated p-4">
              {editingId === s.id ? (
                <div className="space-y-3">
                  <Input
                    value={editForm.label}
                    onChange={(e) =>
                      setEditForm({ ...editForm, label: e.target.value })
                    }
                  />
                  <Input
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}>
                      <Save className="mr-2 h-3.5 w-3.5" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="mr-2 h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-primary">{s.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {s.address}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => beginEdit(s)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(s.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <PaginationBar meta={addressPage.pagination} onPageChange={addressPage.setPage} />
        </div>
      )}
    </div>
  );
}

export function Support() {
  const session = useSession()!;
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const tickets = useStore((s) => s.tickets);
  const myTickets = tickets
    .filter((t) => t.user_id === session.userId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3) return toast.error("Add a subject");
    if (message.trim().length < 5)
      return toast.error("Describe the issue clearly");
    store.addTicket(session.userId, subject.trim(), message.trim());
    setSubject("");
    setMessage("");
    toast.success("Ticket submitted");
  };

  const supportPage = useClientPagination(myTickets, 10);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary">Support</h1>
      <div className="card-elevated p-5 flex items-start gap-4">
        <LifeBuoy className="h-6 w-6 text-accent" />
        <div>
          <div className="font-medium text-primary">
            Delivery support center
          </div>
          <div className="text-sm text-muted-foreground">
            Submit a delivery, payment, wallet, or account issue and track it
            below.
          </div>
        </div>
      </div>
      <form className="card-elevated p-5 space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Payment issue, delivery delay..."
          />
        </div>
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain what happened"
          />
        </div>
        <Button className="accent-gradient text-white shadow-glow">
          Submit ticket
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-primary">
          Your tickets
        </h2>
        {myTickets.length === 0 ? (
          <EmptyState icon={LifeBuoy} title="No support tickets yet" />
        ) : (
          supportPage.items.map((t) => (
            <div key={t.id} className="card-elevated p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-primary">{t.subject}</div>
                <span
                  className={`chip capitalize ${t.status === "closed" ? "bg-success/15 text-success" : t.status === "in_progress" ? "bg-warning/15 text-warning-foreground" : "bg-accent/15 text-accent"}`}
                >
                  {String(t.status).replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                {t.message}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                {shortDate(t.created_at)}
              </div>
            </div>
          ))
        )}
        <PaginationBar meta={supportPage.pagination} onPageChange={supportPage.setPage} />
      </div>
    </div>
  );
}

export function Settings() {
  const session = useSession()!;
  const user = useStore((s) => s.users.find((u) => u.id === session.userId));
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });

  useEffect(() => {
    if (user)
      setForm({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
      });
  }, [user]);

  const save = () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim())
      return toast.error("Name, email and phone are required");
    store.updateUser(session.userId, {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
    });
    toast.success("Profile saved");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary">
        Profile & settings
      </h1>
      <div className="card-elevated p-5 space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
          <User className="h-5 w-5 text-accent" />
          <div>
            <div className="font-medium text-primary">Customer account</div>
            <div className="text-sm text-muted-foreground">
              These details are used on deliveries as your pickup and drop-off
              contact info.
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <Button
          className="accent-gradient text-white shadow-glow"
          onClick={save}
        >
          Save changes
        </Button>
      </div>
      <div className="card-elevated p-5">
        <div className="font-medium text-primary">Sign out</div>
        <p className="text-sm text-muted-foreground mt-1">
          End your session on this device.
        </p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={async () => {
            try {
              await store.logout();
              window.location.href = "/";
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Could not sign out",
              );
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
