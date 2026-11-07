import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Card({ className, ref, ...props }: ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ref, ...props }: ComponentProps<"div">) {
  return <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ref, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ref, ...props }: ComponentProps<"p">) {
  return <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ref, ...props }: ComponentProps<"div">) {
  return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ref, ...props }: ComponentProps<"div">) {
  return <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
