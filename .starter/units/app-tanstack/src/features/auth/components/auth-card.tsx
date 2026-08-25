import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components";
import { cn } from "@repo/ui/lib/utils";
import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
  description?: string;
  footer?: ReactNode;
  title: string;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <Card
      className={cn(
        "corner-superellipse/1.2 mx-auto flex w-full max-w-sm flex-col gap-4 rounded-3xl px-4 py-12 shadow-none",
        className
      )}
    >
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
