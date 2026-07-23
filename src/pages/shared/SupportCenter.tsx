import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FileWarning, LifeBuoy, MessageSquare, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession, useStore } from "@/data/store";
import { supportService } from "@/services/support.service";
import PaginationBar from "@/components/common/PaginationBar";
import { useClientPagination } from "@/hooks/useClientPagination";
import type { Role } from "@/lib/types";

const roleBase = (role: Role) => role === "customer" ? "/app" : `/${role}`;

export default function SupportCenter({ role }: { role: Role }) {
  const session = useSession()!;
  const [category, setCategory] = useState("delivery");
  const [priority, setPriority] = useState("normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const tickets = useStore((s) => s.tickets);
  const myTickets = useMemo(() => tickets.filter((ticket) => ticket.user_id === session.userId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [tickets, session.userId]);
  const base = roleBase(role);
  const ticketPage = useClientPagination(myTickets, 6, [role, session.userId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (subject.trim().length < 3 || message.trim().length < 10) return toast.error("Add a clear subject and description.");
    setSubmitting(true);
    try {
      await supportService.create(session.userId, subject.trim(), message.trim(), { category, priority, requester_role: role });
      setSubject(""); setMessage("");
      toast.success("Support ticket submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit ticket");
    } finally { setSubmitting(false); }
  };

  return <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold text-primary">Help & resolution center</h1>
      <p className="mt-1 text-sm text-muted-foreground">Get help, open a formal dispute, or report suspicious activity.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <div className="card-elevated border-l-4 border-l-accent p-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10"><LifeBuoy className="h-5 w-5 text-accent" /></div>
        <h2 className="font-semibold text-primary">General support</h2>
        <p className="mt-1 min-h-10 text-sm text-muted-foreground">Account, delivery, payment, withdrawal, or technical help.</p>
        <Button className="mt-4 w-full" variant="outline" onClick={() => document.getElementById("new-ticket")?.scrollIntoView({behavior:"smooth"})}>Create ticket</Button>
      </div>
      <div className="card-elevated border-l-4 border-l-warning p-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10"><FileWarning className="h-5 w-5 text-warning" /></div>
        <h2 className="font-semibold text-primary">Delivery dispute</h2>
        <p className="mt-1 min-h-10 text-sm text-muted-foreground">Start a formal case for damage, a missing item, or payment disagreement.</p>
        <Button asChild className="mt-4 w-full" variant="outline"><Link to={`${base}/disputes`}>Open disputes <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
      </div>
      <div className="card-elevated border-l-4 border-l-destructive p-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10"><ShieldAlert className="h-5 w-5 text-destructive" /></div>
        <h2 className="font-semibold text-primary">Fraud alert</h2>
        <p className="mt-1 min-h-10 text-sm text-muted-foreground">Report a suspicious account, payment, delivery, message, or behavior.</p>
        <Button asChild className="mt-4 w-full" variant="outline"><Link to={`${base}/fraud-alert`}>Report fraud <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
      </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
      <form id="new-ticket" className="card-elevated space-y-5 p-5" onSubmit={submit}>
        <div><h2 className="font-display text-lg font-semibold text-primary">Create a support ticket</h2><p className="text-sm text-muted-foreground">Track every request from your account.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Issue type</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={category} onChange={(e)=>setCategory(e.target.value)}><option value="delivery">Delivery</option><option value="payment">Payment</option><option value="withdrawal">Withdrawal</option><option value="verification">Verification</option><option value="account">Account</option><option value="technical">Technical issue</option><option value="general">General enquiry</option></select></div>
          <div className="space-y-2"><Label>Priority</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={priority} onChange={(e)=>setPriority(e.target.value)}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent active-delivery issue</option></select></div>
        </div>
        <div className="space-y-2"><Label>Subject</Label><Input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Briefly describe the problem" /></div>
        <div className="space-y-2"><Label>What happened?</Label><Textarea rows={6} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Include delivery reference, dates, amounts, and the resolution you need." /></div>
        <Button disabled={submitting} className="accent-gradient text-white shadow-glow">{submitting ? "Submitting…" : "Submit ticket"}</Button>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold text-primary">Your tickets</h2><p className="text-sm text-muted-foreground">Latest requests and progress.</p></div><span className="chip bg-muted text-muted-foreground">{myTickets.length}</span></div>
        {myTickets.length === 0 ? <div className="card-elevated grid min-h-64 place-items-center p-8 text-center"><div><MessageSquare className="mx-auto h-9 w-9 text-muted-foreground"/><h3 className="mt-3 font-semibold text-primary">No support tickets yet</h3><p className="mt-1 text-sm text-muted-foreground">New tickets will appear here.</p></div></div> : ticketPage.items.map((ticket)=><article key={ticket.id} className="card-elevated p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-medium text-primary">{ticket.subject}</div><div className="mt-1 text-xs capitalize text-muted-foreground">{ticket.category ?? "general"} · {new Date(ticket.created_at).toLocaleDateString()}</div></div><span className={`chip capitalize ${ticket.status === "closed" ? "bg-success/15 text-success" : "bg-accent/15 text-accent"}`}>{String(ticket.status).replaceAll("_"," ")}</span></div><p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{ticket.message}</p>{ticket.admin_note ? <div className="mt-3 rounded-lg bg-muted p-3 text-sm"><span className="font-medium text-primary">MoveDek update:</span> <span className="text-muted-foreground">{ticket.admin_note}</span></div> : null}</article>)}
      <PaginationBar meta={ticketPage.pagination} onPageChange={ticketPage.setPage} />
      </section>
    </div>
  </div>;
}
