import { ConvexError } from "convex/values";
import { Resend as ResendSdk, type Tag } from "resend";
import {
  EMAIL_ERROR_CODE,
  ERROR_CODE,
  ERROR_MESSAGE,
} from "../errors/constants";

/**
 * Initialize Resend SDK
 */
export const resendSdk = new ResendSdk(
  process.env.RESEND_API_KEY ??
    (() => {
      throw new ConvexError({
        code: ERROR_CODE.UNKNOWN,
        message: ERROR_MESSAGE.UNKNOWN,
      });
    })()
);

/**
 * Helper function to send emails using Resend SDK
 */
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
      headers,
      subject: subject || undefined,
      tags,
      template,
      to,
    });
    if (error) {
      console.error("[resend] Failed to send templated email:", {
        error: error.message,
        subject,
        templateId: template.id,
        to,
      });
      throw new ConvexError({
        code: EMAIL_ERROR_CODE.SEND_FAILED,
        message: ERROR_MESSAGE.UNKNOWN,
      });
    }
    if (!data?.id) {
      console.error("[resend] No email id returned (templated)", {
        subject,
        templateId: template.id,
        to,
      });
      throw new ConvexError({
        code: EMAIL_ERROR_CODE.SEND_FAILED,
        message: ERROR_MESSAGE.UNKNOWN,
      });
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
    headers,
    subject,
    tags,
    to,
  };
  if (html) {
    sendOptions.html = html;
  }
  if (text) {
    sendOptions.text = text;
  }
  const { data, error } = await resendSdk.emails.send(
    sendOptions as Parameters<typeof resendSdk.emails.send>[0]
  );
  if (error) {
    console.error("[resend] Failed to send email:", {
      error: error.message,
      subject,
      to,
    });
    throw new ConvexError({
      code: EMAIL_ERROR_CODE.SEND_FAILED,
      message: ERROR_MESSAGE.UNKNOWN,
    });
  }
  if (!data?.id) {
    console.error("[resend] No email id returned", { subject, to });
    throw new ConvexError({
      code: EMAIL_ERROR_CODE.SEND_FAILED,
      message: ERROR_MESSAGE.UNKNOWN,
    });
  }
  return data.id;
};
