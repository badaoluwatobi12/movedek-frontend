export default function MerchantCustomerCard({ name, phone }: { name: string; phone?: string }) {
  return (
    <div className="card-soft p-4">
      <h3 className="font-semibold text-primary">{name}</h3>
      {phone && <p className="text-sm text-muted-foreground">{phone}</p>}
    </div>
  );
}
