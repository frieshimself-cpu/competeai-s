import { ModelMeta } from "@/lib/models";

export function ModelAvatar({
  meta,
  size = "sm",
}: {
  meta: ModelMeta;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={`avatar ${size}`}
      style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color2})` }}
      title={meta.name}
    >
      {meta.short}
    </span>
  );
}
