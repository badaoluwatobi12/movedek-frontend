import { Switch } from "@/components/ui/switch";
export default function OnlineToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="text-sm">{checked ? "Online" : "Offline"}</span>
    </div>
  );
}
