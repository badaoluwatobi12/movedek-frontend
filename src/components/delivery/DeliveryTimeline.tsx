export default function DeliveryTimeline({ steps = [] }: { steps?: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={s} className="text-sm">
          <span className="font-medium">{i + 1}.</span> {s}
        </li>
      ))}
    </ol>
  );
}
