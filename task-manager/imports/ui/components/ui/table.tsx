import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Table({ className, ref, ...props }: ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ref, ...props }: ComponentProps<"thead">) {
  return <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({ className, ref, ...props }: ComponentProps<"tbody">) {
  return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ref, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      ref={ref}
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ref, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ref, ...props }: ComponentProps<"th">) {
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ref, ...props }: ComponentProps<"td">) {
  return (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}

function TableCaption({ className, ref, ...props }: ComponentProps<"caption">) {
  return (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
