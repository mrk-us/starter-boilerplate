import { Resend as ResendSdk, type Tag } from "resend";

export const resendSdk = new ResendSdk(
	process.env.RESEND_API_KEY ??
		(() => {
			throw new Error("RESEND_API_KEY environment variable is not set");
		})()
);

// Helper function to send emails using Resend SDK
export const sendResendEmail = async (
	from: string,
	to: string | string[],
	subject: string,
	headers: Record<string, string>,
	tags: Tag[],
	template?: { id: string; variables?: Record<string, string | number> },
	html?: string,
	text?: string
): Promise<string> => {
	if (template) {
		const { data, error } = await resendSdk.emails.send({
			from,
			to,
			template,
			subject: subject || undefined,
			headers,
			tags,
		});
		if (error) {
			throw new Error(error.message);
		}
		if (!data?.id) {
			throw new Error("No id returned from Resend");
		}
		return data.id;
	}

	const sendOptions: {
		from: string;
		to: string | string[];
		subject: string;
		html?: string;
		text?: string;
		headers: Record<string, string>;
		tags: Tag[];
	} = {
		from,
		to,
		subject,
		headers,
		tags,
	};
	if (html) {
		sendOptions.html = html;
	}
	if (text) {
		sendOptions.text = text;
	}
	const { data, error } = await resendSdk.emails.send(sendOptions as Parameters<typeof resendSdk.emails.send>[0]);
	if (error) {
		throw new Error(error.message);
	}
	if (!data?.id) {
		throw new Error("No id returned from Resend");
	}
	return data.id;
};
