export function DecideItem({
  icon: Icon,
  title,
  body,
}: {
  icon: any;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-foreground text-background grid place-items-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold mb-0.5">{title}</div>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
