// A small pill showing one skill. variant: "default" | "matched" | "missing"
export default function SkillBadge({ name, variant = "default" }) {
  return <span className={`badge badge-${variant}`}>{name}</span>;
}
