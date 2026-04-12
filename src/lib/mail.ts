import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendMail = async ({ 
  to, 
  subject, 
  html 
}: { 
  to: string; 
  subject: string; 
  html: string 
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"Leadnova System" <leadnovasystem@gmail.com>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};
