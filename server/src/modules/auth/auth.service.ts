import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
if(!resend) {
  throw new Error('Resend API key is not defined in the environment variables.');
}



export const sendOtpEmail = async (to: string, {username, otp}: {username: string, otp: string}) => {
    console.log(`username: ${username}, otp: ${otp}`);
    try {
        const subject = "Verify your email for ChaiTalk";
        const html = `
            <!DOCTYPE html>
                <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
                <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="color-scheme" content="light only" />
                <title>Verify your email – ChaiTalk</title>
                </head>
                <body style="margin:0; padding:0; background-color:#faf5ef; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

                <!-- Preheader (hidden preview text) -->
                <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#faf5ef; font-size:1px; line-height:1px;">
                    Your ChaiTalk verification code is {{otp}}. It expires in 10 minutes.
                </div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf5ef;">
                    <tr>
                    <td align="center" style="padding:32px 16px;">

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(120,72,24,0.08);">

                        <!-- Header -->
                        <tr>
                            <td align="center" style="background-color:#8b4a1c; padding:28px 24px;">
                            <div style="font-size:26px; font-weight:700; color:#ffffff; letter-spacing:0.3px;">
                                &#9749; ChaiTalk
                            </div>
                            <div style="font-size:13px; color:#f1d9c2; margin-top:4px;">
                                Conversations, brewed fresh.
                            </div>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:36px 32px 8px 32px;">
                            <h1 style="margin:0 0 12px 0; font-size:22px; line-height:1.3; color:#2b1a0e; font-weight:700;">
                                Verify your email address
                            </h1>
                            <p style="margin:0 0 8px 0; font-size:15px; line-height:1.6; color:#4a3a2e;">
                                Hi ${username},
                            </p>
                            <p style="margin:0; font-size:15px; line-height:1.6; color:#4a3a2e;">
                                Welcome to ChaiTalk! Use the one-time password below to verify your email and finish setting up your account.
                            </p>
                            </td>
                        </tr>

                        <!-- OTP box -->
                        <tr>
                            <td align="center" style="padding:28px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:#fdf1e3; border:2px dashed #d9a066; border-radius:12px;">
                                <tr>
                                <td align="center" style="padding:18px 36px;">
                                    <div style="font-size:12px; text-transform:uppercase; letter-spacing:1.5px; color:#8b4a1c; margin-bottom:6px;">
                                    Your verification code
                                    </div>
                                    <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace; font-size:36px; font-weight:700; letter-spacing:10px; color:#2b1a0e; padding-left:10px;">
                                    ${otp}
                                    </div>
                                </td>
                                </tr>
                            </table>
                            <p style="margin:16px 0 0 0; font-size:13px; color:#7a6757;">
                                This code expires in <strong>10 minutes</strong>.
                            </p>
                            </td>
                        </tr>

                        <!-- Security note -->
                        <tr>
                            <td style="padding:0 32px 32px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f3ee; border-radius:10px;">
                                <tr>
                                <td style="padding:14px 16px; font-size:13px; line-height:1.6; color:#5c4b3d;">
                                    <strong>Keep it private.</strong> ChaiTalk will never ask for this code over a call, chat, or message. Don't share it with anyone.
                                </td>
                                </tr>
                            </table>
                            <p style="margin:20px 0 0 0; font-size:13px; line-height:1.6; color:#7a6757;">
                                Didn't create a ChaiTalk account? You can safely ignore this email &mdash; no account will be created without verification.
                            </p>
                            </td>
                        </tr>

                        </table>

                    </td>
                    </tr>
                </table>

                </body>
                </html>
        `
        const from = process.env.EMAIL_FROM;
        if(!from) {
            throw new Error('Email from address is not defined in the environment variables.');
        }
        const data = await resend.emails.send({
            from: from,
            to: to,
            subject: subject,
            html: html,
        });

        return data;

    } catch (error) {
        console.error({ error });
        throw error;
    }
}