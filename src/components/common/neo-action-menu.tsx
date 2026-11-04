import { MoreVertical, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Action = {
  label: string;
  icon: LucideIcon;
  tone: "mint" | "pink" | "blue" | "neutral";
  onSelect: () => void;
};

export function NeoActionMenu({ label, actions }: { label: string; actions: Action[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="neo-action-trigger" aria-label={label} title={label}>
        <MoreVertical size={22} strokeWidth={2.7} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="left" sideOffset={12} className="neo-action-menu">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            className={`neo-action-item neo-action-${action.tone}`}
            onClick={action.onSelect}
          >
            <action.icon size={19} strokeWidth={2.4} />
            <span>{action.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
