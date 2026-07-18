export default function DisputeCard({ title, status }: { title: string; status?: string }) {
  return (
    <div className="card-soft p-4">
      <h3 className="font-semibold text-primary">{title}</h3>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}
