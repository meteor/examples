import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

function Label({ className, ref, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />;
}

export { Label };
