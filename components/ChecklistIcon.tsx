import { BookOpen, Compass, PencilLine, PiggyBank, Users, CircleHelp } from "lucide-react";

const ICONS: Record<string, typeof BookOpen> = {
  "book-open": BookOpen,
  "pencil-line": PencilLine,
  users: Users,
  compass: Compass,
  "piggy-bank": PiggyBank,
};

export default function ChecklistIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? CircleHelp;
  return <Icon className={className} />;
}
