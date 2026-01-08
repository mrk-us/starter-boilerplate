"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import type { ReactNode } from "react";

type AuthCardProps = {
	title: string;
	description?: string;
	children: ReactNode;
	footer?: ReactNode;
};

export function AuthCard({
	title,
	description,
	children,
	footer,
}: AuthCardProps) {
	return (
		<Card className="w-full max-w-md mx-auto bg-transparent p-0 rounded-none gap-6 shadow-none">
			<CardHeader className="text-center">
				<CardTitle className="text-lg">{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>{children}</CardContent>
			{footer && <CardFooter>{footer}</CardFooter>}
		</Card>
	);
}
