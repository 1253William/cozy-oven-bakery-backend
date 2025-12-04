import PDFDocument from "pdfkit";
// @ts-ignore
import getStream from "get-stream";

/**
 * generateReceiptPdfBuffer(order)
 * returns a Buffer of a simple receipt PDF
 */
export const generateReceiptPdfBuffer = async (order: any): Promise<Buffer> => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: "A4", margin: 40 });
            const stream = doc.pipe(require("stream").PassThrough());

            doc.fontSize(18).text("Cozy Oven Receipt", { align: "center" });
            doc.moveDown();
            doc.fontSize(12).text(`Order ID: ${order.orderId}`);
            doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}`);
            doc.text(`Total: ${order.totalAmount}`);
            doc.moveDown();

            doc.text("Items:");
            order.items.forEach((it: any) => {
                doc.text(`${it.quantity} x ${it.name} @ ${it.unitPrice} = ${it.total}`);
            });

            doc.moveDown();
            doc.text(`Subtotal: ${order.subtotal}`);
            doc.text(`Delivery fee: ${order.deliveryFee}`);
            doc.text(`TOTAL: ${order.totalAmount}`, { underline: true });
            doc.moveDown();
            doc.text("Thank you for ordering from Cozy Oven!", { align: "center" });

            doc.end();

            const buffer = await getStream.buffer(stream);
            resolve(buffer);
        } catch (err) {
            reject(err);
        }
    });
};
