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
				"flex flex-col w-full max-w-sm mx-auto bg-transparent px-4 py-12 rounded-3xl corner-superellipse/1.2 gap-4 shadow-none",
				className,
			)}
		>
			<CardHeader className="text-center pb-4">
				<CardTitle className="text-lg">{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent className="flex flex-col gap-6">{children}</CardContent>
			{footer && <CardFooter>{footer}</CardFooter>}
		</Card>
	);
}
