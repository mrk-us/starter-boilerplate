"use client";

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

type AuthCardProps = {
	title: string;
	description?: string;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
};

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
				"flex flex-col w-full max-w-md mx-auto bg-transparent p-0 rounded-none gap-6 shadow-none",
				className,
			)}
		>
			<CardHeader className="text-center">
				<CardTitle className="text-lg">{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent className="flex flex-col gap-6">{children}</CardContent>
			{footer && <CardFooter>{footer}</CardFooter>}
		</Card>
	);
}
