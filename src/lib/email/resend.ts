import { Resend } from "resend";
import { env } from "~/env";

// Create Resend client only if API key is available
export const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

// Default from email
export const FROM_EMAIL = "Kiwatt <noreply@kiwatt.ch>";
