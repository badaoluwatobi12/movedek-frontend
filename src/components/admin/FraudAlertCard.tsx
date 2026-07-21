export default function FraudAlertCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
      {message}
    </div>
  );
}
