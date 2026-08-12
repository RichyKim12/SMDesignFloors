import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  fetch: withSupabase({ auth: ["publishable", "secret", "anon"] }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const { formData, files } = await req.json();

      console.log(`Processing submission for: ${formData.email}`);

      // 1. Send Email via Resend API
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Acme <onboarding@resend.dev>", // Replace with your verified domain in production
            to: [formData.email],
            subject: "Application Received!",
            html: `<p>Hi ${formData.name},</p><p>Thank you for submitting your application!</p>`,
          }),
        });

        const resData = await res.json();
        console.log("Resend API response:", resData);
      } else {
        console.warn("RESEND_API_KEY is not set in environment variables!");
      }

      return Response.json(
        { message: "Registration submitted successfully!" },
        { status: 200, headers: corsHeaders }
      );
    } catch (err: any) {
      console.error("Function error:", err.message);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 400, headers: corsHeaders }
      );
    }
  }),
};