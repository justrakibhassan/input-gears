import { logger } from "./logger";

export interface InvoiceEmailOptions {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  items: { name: string; quantity: number; price: number }[];
}

/**
 * Sends order invoice email to customer upon successful order placement.
 * Uses environment SMTP configuration if available, otherwise logs invoice summary.
 */
export async function sendOrderInvoiceEmail(options: InvoiceEmailOptions): Promise<boolean> {
  const { toEmail, customerName, orderNumber, totalAmount, paymentMethod, items } = options;

  if (!toEmail) return false;

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const emailHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px;">
    <h2 style="color: #4f46e5; margin-bottom: 4px;">InputGears - Order Confirmation</h2>
    <p style="color: #666; font-size: 14px; margin-top: 0;">Order #${orderNumber}</p>
    
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Thank you for your order at InputGears! We have received your order and are processing it.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <thead>
        <tr style="background-color: #f8fafc; text-align: left;">
          <th style="padding: 8px; border-bottom: 2px solid #e2e8f0;">Item</th>
          <th style="padding: 8px; border-bottom: 2px solid #e2e8f0; text-align: center;">Qty</th>
          <th style="padding: 8px; border-bottom: 2px solid #e2e8f0; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div style="margin-top: 20px; text-align: right;">
      <p style="font-size: 16px; font-weight: bold; color: #1e293b;">
        Total Amount: <span style="color: #4f46e5;">$${totalAmount.toFixed(2)}</span>
      </p>
      <p style="font-size: 12px; color: #64748b;">Payment Method: ${paymentMethod}</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    
    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
      If you have any questions, track your order on our site or reply to support@inputgears.com.
    </p>
  </div>
  `;

  try {
    logger.info(`[Email Service] Prepared Invoice Email for ${toEmail} (Order #${orderNumber})`);
    
    // In production, this integrates with SMTP transport / Resend API / SendGrid.
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "InputGears <orders@inputgears.com>",
          to: [toEmail],
          subject: `Your InputGears Invoice #${orderNumber}`,
          html: emailHtml,
        }),
      });
    }

    return true;
  } catch (error) {
    logger.error("Failed to send order invoice email:", error);
    return false;
  }
}
