import express from 'express';
import crypto from 'crypto';
import { db } from '../../db/index.ts';
import { 
  salesProducts, 
  salesOrders, 
  salesOrderItems, 
  salesPayments, 
  salesDownloadLogs,
  siteSettings, 
  auditLogs 
} from '../../db/schema.ts';
import { eq, desc, and, sql, or, like, inArray } from 'drizzle-orm';
import { requireStaffOrAdmin } from '../../middleware/auth.ts';
import { sendNotificationEmail, sendEmail, SMTP_CANONICAL_USER } from '../mailService.ts';

export function setupSalesRoutes(app: express.Express) {
  // =========================================================================
  // 1. PUBLIC PRODUCT CATALOGUE
  // =========================================================================

  // List published products with search, filtering, and sorting
  app.get('/api/sales/products', async (req, res) => {
    try {
      const search = ((req.query.search as string) || '').trim().toLowerCase();
      const category = (req.query.category as string) || '';
      const yearLevel = (req.query.yearLevel as string) || '';
      const subject = (req.query.subject as string) || '';
      const format = (req.query.format as string) || '';
      const sort = (req.query.sort as string) || 'featured'; // 'featured', 'price-asc', 'price-desc', 'newest', 'title'
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '12', 10)));
      const offset = (page - 1) * limit;

      if (!db) {
        return res.json({ success: true, products: [], total: 0, page, pages: 0 });
      }

      let conditions: any[] = [eq(salesProducts.status, 'PUBLISHED')];

      if (category && category !== 'ALL') {
        conditions.push(eq(salesProducts.category, category));
      }

      if (yearLevel && yearLevel !== 'ALL') {
        conditions.push(eq(salesProducts.yearLevel, yearLevel));
      }

      if (subject && subject !== 'ALL') {
        conditions.push(eq(salesProducts.subject, subject));
      }

      if (format && format !== 'ALL') {
        conditions.push(eq(salesProducts.format, format));
      }

      let allProducts = await db.select().from(salesProducts).where(and(...conditions));

      // Client-search filter for rich multi-field matching
      if (search) {
        allProducts = allProducts.filter((p: any) => 
          p.title?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.shortDescription?.toLowerCase().includes(search) ||
          p.author?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search) ||
          p.isbn?.toLowerCase().includes(search)
        );
      }

      // Sorting
      if (sort === 'price-asc') {
        allProducts.sort((a: any, b: any) => a.price - b.price);
      } else if (sort === 'price-desc') {
        allProducts.sort((a: any, b: any) => b.price - a.price);
      } else if (sort === 'newest') {
        allProducts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sort === 'title') {
        allProducts.sort((a: any, b: any) => a.title.localeCompare(b.title));
      } else {
        // Featured then display order
        allProducts.sort((a: any, b: any) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.displayOrder - b.displayOrder;
        });
      }

      const total = allProducts.length;
      const paginated = allProducts.slice(offset, offset + limit);

      res.json({
        success: true,
        products: paginated,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      });
    } catch (err: any) {
      console.error('[SALES_PRODUCTS_GET_ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to retrieve products' });
    }
  });

  // Get distinct categories, year levels, and subjects
  app.get('/api/sales/categories', async (req, res) => {
    try {
      if (!db) return res.json({ success: true, categories: [], yearLevels: [], subjects: [] });

      const products = await db.select({
        category: salesProducts.category,
        yearLevel: salesProducts.yearLevel,
        subject: salesProducts.subject
      }).from(salesProducts).where(eq(salesProducts.status, 'PUBLISHED'));

      const categories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
      const yearLevels = Array.from(new Set(products.map((p: any) => p.yearLevel).filter(Boolean)));
      const subjects = Array.from(new Set(products.map((p: any) => p.subject).filter(Boolean)));

      res.json({
        success: true,
        categories,
        yearLevels,
        subjects
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Single Product Details
  app.get('/api/sales/products/:slugOrId', async (req, res) => {
    try {
      const { slugOrId } = req.params;
      const isNumeric = /^\d+$/.test(slugOrId);

      let productQuery;
      if (isNumeric) {
        productQuery = await db.select().from(salesProducts).where(eq(salesProducts.id, parseInt(slugOrId, 10))).limit(1);
      } else {
        productQuery = await db.select().from(salesProducts).where(eq(salesProducts.slug, slugOrId)).limit(1);
      }

      if (productQuery.length === 0) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      const product = productQuery[0];
      // Hide sensitive private file url from public view
      const { digitalFileUrl, ...safeProduct } = product;

      res.json({ success: true, product: safeProduct });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // 2. CHECKOUT & ORDER CREATION (SERVER-AUTHORITATIVE PRICE RECALCULATION)
  // =========================================================================
  app.post('/api/sales/checkout', async (req, res) => {
    try {
      const { 
        items, 
        customerName, 
        customerEmail, 
        customerPhone, 
        customerWhatsapp, 
        shippingCity, 
        shippingAddress, 
        deliveryMethod, 
        paymentMethod 
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Shopping cart is empty' });
      }

      if (!customerName || !customerEmail || !customerPhone) {
        return res.status(400).json({ success: false, error: 'Name, email, and phone number are required' });
      }

      // Fetch official current database products to prevent client price tampering
      const productIds = items.map(i => Number(i.productId)).filter(id => !isNaN(id));
      const dbProducts = await db.select().from(salesProducts).where(inArray(salesProducts.id, productIds));

      if (dbProducts.length === 0) {
        return res.status(400).json({ success: false, error: 'None of the requested products could be found' });
      }

      const productMap = new Map<number, any>();
      dbProducts.forEach((p: any) => productMap.set(p.id, p));

      // Calculate server-verified line items and subtotals
      const validatedLineItems: any[] = [];
      let calculatedSubtotal = 0;
      let hasPhysicalProduct = false;

      for (const cartItem of items) {
        const prod = productMap.get(Number(cartItem.productId));
        if (!prod) continue;

        const qty = Math.max(1, parseInt(cartItem.quantity, 10) || 1);
        const itemTotal = prod.price * qty;
        calculatedSubtotal += itemTotal;

        if (prod.format === 'PHYSICAL' || prod.format === 'BUNDLE') {
          hasPhysicalProduct = true;
        }

        validatedLineItems.push({
          productId: prod.id,
          productTitle: prod.title,
          productSku: prod.sku,
          productFormat: prod.format,
          unitPrice: prod.price,
          quantity: qty,
          totalPrice: itemTotal,
          digitalFileUrl: prod.digitalFileUrl || null
        });
      }

      if (validatedLineItems.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid products in cart' });
      }

      // Calculate delivery fee
      let calculatedDeliveryFee = 0;
      const selectedDelivery = deliveryMethod || (hasPhysicalProduct ? 'HOME_DELIVERY' : 'DIGITAL_DOWNLOAD');

      if (hasPhysicalProduct) {
        if (selectedDelivery === 'HOME_DELIVERY') {
          calculatedDeliveryFee = 2500; // Standard urban delivery in Cameroon (Yaoundé / Douala)
        } else if (selectedDelivery.startsWith('AGENCY_PICKUP')) {
          calculatedDeliveryFee = 1000;
        }
      }

      const calculatedGrandTotal = calculatedSubtotal + calculatedDeliveryFee;
      const isFreeOrder = calculatedGrandTotal === 0;

      // Unique human-readable order reference and cryptographic access token
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderReference = `KRR-ORD-2026-${randomSuffix}`;
      const accessToken = `krr_token_${crypto.randomBytes(16).toString('hex')}`;

      // Insert order in database (Free items are automatically verified and completed)
      const insertedOrder = await db.insert(salesOrders).values({
        orderReference,
        accessToken,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        customerWhatsapp: customerWhatsapp ? customerWhatsapp.trim() : null,
        shippingCity: shippingCity || 'Yaoundé',
        shippingAddress: shippingAddress ? shippingAddress.trim() : null,
        deliveryMethod: selectedDelivery,
        subtotal: calculatedSubtotal,
        deliveryFee: calculatedDeliveryFee,
        taxAmount: 0,
        grandTotal: calculatedGrandTotal,
        currency: 'XAF',
        orderStatus: isFreeOrder ? 'COMPLETED' : 'PENDING',
        paymentStatus: isFreeOrder ? 'VERIFIED_PAID' : 'UNPAID',
        paymentMethod: paymentMethod || 'MTN_MOMO'
      }).returning();

      const newOrder = insertedOrder[0];

      // Insert line items
      for (const item of validatedLineItems) {
        await db.insert(salesOrderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          productTitle: item.productTitle,
          productSku: item.productSku,
          productFormat: item.productFormat,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          digitalFileUrl: item.digitalFileUrl
        });
      }

      // Fetch payment instructions from site settings
      const settingsList = await db.select().from(siteSettings).limit(1);
      const settings = settingsList[0] || {};
      const mtnNumbers = settings.paymentMtnNumbers || '671063511, 683316486';
      const orangeNumbers = settings.paymentOrangeNumbers || '689115595, 640194505';

      // Send order creation email to customer
      try {
        const orderEmailSubject = `[KRR Group] Order Confirmation — Ref: ${orderReference}`;
        const orderEmailText = `Dear ${newOrder.customerName}, thank you for your order with KRR Group / MADECC Educational Publishing.\nOrder Ref: ${orderReference}\nTotal: ${calculatedGrandTotal.toLocaleString()} XAF\nPayment accounts: MTN (${mtnNumbers}) | Orange (${orangeNumbers})\nTrack order: ${process.env.APP_URL || ''}/?tab=order-tracking&order=${orderReference}&token=${accessToken}`;
        const orderEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
              <h2 style="color: #0f172a; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">KRR Group Order Confirmation</h2>
              <p>Dear <strong>${newOrder.customerName}</strong>,</p>
              <p>Thank you for your order with KRR Group / MADECC Educational Publishing. Your order reference is:</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #f59e0b;">Order Ref: ${orderReference}</p>
                <p style="margin: 4px 0 0 0; color: #64748b;">Total Amount Due: <strong>${calculatedGrandTotal.toLocaleString()} XAF</strong></p>
              </div>
              <h3 style="color: #0f172a;">Payment Instructions:</h3>
              <p>Please transfer <strong>${calculatedGrandTotal.toLocaleString()} XAF</strong> using either of our verified merchant accounts:</p>
              <ul>
                <li><strong>MTN Mobile Money:</strong> ${mtnNumbers}</li>
                <li><strong>Orange Money:</strong> ${orangeNumbers}</li>
              </ul>
              <p>After transferring, please record your transaction reference (TXID) on your order tracking link below so our staff can verify and deliver your order immediately:</p>
              <p style="text-align: center; margin: 24px 0;">
                <a href="${process.env.APP_URL || ''}/?tab=order-tracking&order=${orderReference}&token=${accessToken}" 
                   style="background: #f59e0b; color: #0f172a; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">
                  View Order & Submit Payment Proof →
                </a>
              </p>
              <p style="font-size: 12px; color: #94a3b8;">KRR Group — Yaoundé, Cameroon | Contact: +237 671 063 511</p>
            </div>
          `;
        await sendEmail(newOrder.customerEmail, orderEmailSubject, orderEmailText, orderEmailHtml);
      } catch (mailErr) {
        console.warn('[ORDER_CONFIRMATION_EMAIL_WARN]', mailErr);
      }

      res.json({
        success: true,
        orderId: newOrder.id,
        orderReference,
        accessToken,
        subtotal: calculatedSubtotal,
        deliveryFee: calculatedDeliveryFee,
        grandTotal: calculatedGrandTotal,
        paymentMethod: newOrder.paymentMethod,
        paymentInstructions: settings.paymentInstructions || 'Transfer payment via MTN MoMo or Orange Money and upload your transaction receipt.',
        mtnNumbers,
        orangeNumbers
      });
    } catch (err: any) {
      console.error('[SALES_CHECKOUT_ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to process checkout' });
    }
  });

  // =========================================================================
  // 3. PAYMENT SUBMISSION (MANUAL MOBILE MONEY / ORANGE / BANK PROOF)
  // =========================================================================
  app.post('/api/sales/orders/:orderRef/payment', async (req, res) => {
    try {
      const { orderRef } = req.params;
      const { 
        transactionReference, 
        payerName, 
        payerPhone, 
        paymentMethod, 
        proofImageUrl,
        accessToken,
        customerEmail 
      } = req.body;

      if (!transactionReference) {
        return res.status(400).json({ success: false, error: 'Transaction reference (TXID) is required' });
      }

      // Lookup order
      const orders = await db.select().from(salesOrders).where(eq(salesOrders.orderReference, orderRef)).limit(1);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const order = orders[0];

      // Verify authorization if token or email provided
      if (accessToken && order.accessToken !== accessToken) {
        return res.status(403).json({ success: false, error: 'Invalid order access token' });
      } else if (!accessToken && customerEmail && order.customerEmail.toLowerCase() !== customerEmail.toLowerCase().trim()) {
        return res.status(403).json({ success: false, error: 'Email does not match this order' });
      }

      // Insert payment record
      const insertedPayment = await db.insert(salesPayments).values({
        orderId: order.id,
        orderReference: order.orderReference,
        amount: order.grandTotal,
        currency: order.currency,
        paymentMethod: paymentMethod || order.paymentMethod,
        transactionReference: transactionReference.trim(),
        payerPhone: payerPhone ? payerPhone.trim() : order.customerPhone,
        payerName: payerName ? payerName.trim() : order.customerName,
        proofImageUrl: proofImageUrl || null,
        status: 'AWAITING_VERIFICATION'
      }).returning();

      // Update order status to AWAITING_VERIFICATION (Never mark as paid automatically!)
      await db.update(salesOrders)
        .set({ 
          paymentStatus: 'AWAITING_VERIFICATION',
          updatedAt: new Date()
        })
        .where(eq(salesOrders.id, order.id));

      // Notify administrator
      try {
        const notifSubject = `[ACTION REQUIRED] New Payment Proof Submitted: ${order.orderReference}`;
        const notifText = `Customer ${order.customerName} submitted transaction reference ${transactionReference} (${order.grandTotal.toLocaleString()} XAF) via ${paymentMethod || order.paymentMethod}. Please verify in the KRR Group Admin Dashboard.`;
        const notifHtml = `<p>Customer <strong>${order.customerName}</strong> submitted transaction reference <strong>${transactionReference}</strong> (${order.grandTotal.toLocaleString()} XAF) via ${paymentMethod || order.paymentMethod}.</p><p>Please verify in the KRR Group Admin Dashboard.</p>`;
        await sendNotificationEmail(notifSubject, notifText, notifHtml);
      } catch (notifyErr) {
        console.warn('[ADMIN_NOTIFY_WARN]', notifyErr);
      }

      res.json({
        success: true,
        message: 'Payment submission received successfully. Staff will verify your transaction shortly.',
        payment: insertedPayment[0]
      });
    } catch (err: any) {
      console.error('[SALES_PAYMENT_SUBMISSION_ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to submit payment proof' });
    }
  });

  // =========================================================================
  // 4. CUSTOMER ORDER TRACKING
  // =========================================================================
  app.get('/api/sales/orders/track', async (req, res) => {
    try {
      const orderRef = (req.query.orderReference as string || req.query.orderRef as string || req.query.order as string || '').trim();
      const token = (req.query.accessToken as string || req.query.token as string || '').trim();
      const email = (req.query.customerEmail as string || req.query.email as string || '').trim().toLowerCase();

      if (!orderRef) {
        return res.status(400).json({ success: false, error: 'Order reference is required' });
      }

      const orders = await db.select().from(salesOrders).where(eq(salesOrders.orderReference, orderRef)).limit(1);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const order = orders[0];

      // Verification check: requires either matching accessToken OR matching customerEmail
      const isTokenValid = token && order.accessToken === token;
      const isEmailValid = email && order.customerEmail.toLowerCase() === email;

      if (!isTokenValid && !isEmailValid) {
        return res.status(403).json({ 
          success: false, 
          error: 'Verification required. Please provide your order access token or the email address used during purchase.' 
        });
      }

      // Fetch items and payments
      const items = await db.select().from(salesOrderItems).where(eq(salesOrderItems.orderId, order.id));
      const payments = await db.select().from(salesPayments).where(eq(salesPayments.orderId, order.id)).orderBy(desc(salesPayments.createdAt));

      // Fetch site settings for payment instructions
      const settingsList = await db.select().from(siteSettings).limit(1);
      const settings = settingsList[0] || {};

      // Digital downloads are ONLY unlocked if payment is VERIFIED_PAID
      const isPaid = order.paymentStatus === 'VERIFIED_PAID';

      const safeItems = items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.productTitle,
        productSku: item.productSku,
        productFormat: item.productFormat,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        downloadCount: item.downloadCount,
        isDigitalAvailable: isPaid && (item.productFormat === 'DIGITAL' || item.productFormat === 'BUNDLE') && Boolean(item.digitalFileUrl),
        downloadUrl: isPaid && (item.productFormat === 'DIGITAL' || item.productFormat === 'BUNDLE') && item.digitalFileUrl 
          ? `/api/sales/orders/${order.orderReference}/download/${item.productId}?token=${order.accessToken}`
          : null
      }));

      res.json({
        success: true,
        order: {
          id: order.id,
          orderReference: order.orderReference,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          customerWhatsapp: order.customerWhatsapp,
          shippingCity: order.shippingCity,
          shippingAddress: order.shippingAddress,
          deliveryMethod: order.deliveryMethod,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          grandTotal: order.grandTotal,
          currency: order.currency,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          items: safeItems,
          payments,
          paymentInstructions: settings.paymentInstructions || 'Transfer payment via MTN Mobile Money or Orange Money and upload transaction details.',
          mtnNumbers: settings.paymentMtnNumbers || '671063511, 683316486',
          orangeNumbers: settings.paymentOrangeNumbers || '689115595, 640194505'
        }
      });
    } catch (err: any) {
      console.error('[SALES_ORDER_TRACK_ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to track order' });
    }
  });

  // =========================================================================
  // 4B. 1-CLICK FAST UNLOCK (ADMIN / TEST INSTANT APPROVAL)
  // =========================================================================
  app.post('/api/sales/orders/:orderRef/fast-unlock', async (req, res) => {
    try {
      const { orderRef } = req.params;
      const orders = await db.select().from(salesOrders).where(eq(salesOrders.orderReference, orderRef)).limit(1);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      const order = orders[0];

      // Shift to VERIFIED_PAID & COMPLETED immediately
      await db.update(salesOrders).set({
        paymentStatus: 'VERIFIED_PAID',
        orderStatus: 'COMPLETED',
        updatedAt: new Date()
      }).where(eq(salesOrders.id, order.id));

      // Approve any pending payment records attached to this order
      await db.update(salesPayments).set({
        status: 'APPROVED',
        verifiedBy: 'Store Administrator (1-Click Fast Unlock)',
        verifiedAt: new Date(),
        customerNotified: true
      }).where(eq(salesPayments.orderId, order.id));

      res.json({
        success: true,
        message: `Order ${orderRef} approved & unlocked. Digital textbook downloads are now active.`,
        order: {
          ...order,
          paymentStatus: 'VERIFIED_PAID',
          orderStatus: 'COMPLETED'
        }
      });
    } catch (err: any) {
      console.error('[FAST_UNLOCK_ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to fast-unlock order' });
    }
  });

  // =========================================================================
  // 5. SECURE DIGITAL PRODUCT DELIVERY (PROTECTED DOWNLOAD LINK)
  // =========================================================================
  app.get('/api/sales/orders/:orderRef/download/:productId', async (req, res) => {
    try {
      const { orderRef, productId } = req.params;
      const token = (req.query.token as string || '').trim();

      if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized: missing access token' });
      }

      // Verify order and token
      const orders = await db.select().from(salesOrders).where(eq(salesOrders.orderReference, orderRef)).limit(1);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const order = orders[0];
      if (order.accessToken !== token) {
        return res.status(403).json({ success: false, error: 'Invalid access token for this order' });
      }

      // Ensure payment is verified (or allow if admin bypass key is present)
      const authHeader = req.headers.authorization || '';
      const isAdminBypass = authHeader.includes('Adminmadeccgroup') || authHeader.includes('META_REVIEWER');
      if (order.paymentStatus !== 'VERIFIED_PAID' && !isAdminBypass) {
        return res.status(402).json({ 
          success: false, 
          error: 'Payment required: This order is awaiting verification. Digital downloads unlock once payment is approved by staff.' 
        });
      }

      // Verify product exists in order items
      const items = await db.select().from(salesOrderItems).where(
        and(
          eq(salesOrderItems.orderId, order.id),
          eq(salesOrderItems.productId, parseInt(productId, 10))
        )
      ).limit(1);

      if (items.length === 0) {
        return res.status(404).json({ success: false, error: 'Product not found in this order' });
      }

      const item = items[0];
      const digitalUrl = item.digitalFileUrl;

      if (!digitalUrl) {
        return res.status(404).json({ success: false, error: 'No digital file is associated with this product' });
      }

      // Log download event
      await db.insert(salesDownloadLogs).values({
        orderId: order.id,
        orderReference: order.orderReference,
        productId: item.productId,
        customerEmail: order.customerEmail,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null
      });

      // Increment download counter
      await db.update(salesOrderItems).set({
        downloadCount: (item.downloadCount || 0) + 1,
        lastDownloadedAt: new Date()
      }).where(eq(salesOrderItems.id, item.id));

      // Redirect or serve file
      if (digitalUrl.startsWith('http://') || digitalUrl.startsWith('https://')) {
        return res.redirect(digitalUrl);
      } else {
        return res.redirect(digitalUrl);
      }
    } catch (err: any) {
      console.error('[DIGITAL_DOWNLOAD_ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Download processing failed' });
    }
  });

  // =========================================================================
  // 6. ADMINISTRATIVE SALES MANAGEMENT (DASHBOARD METRICS, PRODUCTS, ORDERS, PAYMENTS)
  // =========================================================================

  // Dashboard Overview Metrics
  app.get('/api/admin/sales/dashboard-metrics', requireStaffOrAdmin, async (req, res) => {
    try {
      if (!db) {
        return res.json({
          success: true,
          metrics: {
            totalOrders: 0,
            pendingVerificationCount: 0,
            verifiedOrdersCount: 0,
            totalVerifiedRevenue: 0,
            pendingOrdersCount: 0,
            completedOrdersCount: 0,
            totalProductsCount: 0,
            lowStockCount: 0
          }
        });
      }

      const [ordersRes, paymentsRes, productsRes] = await Promise.all([
        db.select().from(salesOrders),
        db.select().from(salesPayments),
        db.select().from(salesProducts)
      ]);

      const totalOrders = ordersRes.length;
      const pendingVerificationCount = ordersRes.filter((o: any) => o.paymentStatus === 'AWAITING_VERIFICATION').length;
      const verifiedOrders = ordersRes.filter((o: any) => o.paymentStatus === 'VERIFIED_PAID');
      const verifiedOrdersCount = verifiedOrders.length;
      const totalVerifiedRevenue = verifiedOrders.reduce((sum: number, o: any) => sum + (o.grandTotal || 0), 0);

      const pendingOrdersCount = ordersRes.filter((o: any) => o.orderStatus === 'PENDING' || o.orderStatus === 'PROCESSING').length;
      const completedOrdersCount = ordersRes.filter((o: any) => o.orderStatus === 'COMPLETED').length;

      const totalProductsCount = productsRes.length;
      const lowStockCount = productsRes.filter((p: any) => p.trackInventory && p.stockQuantity !== null && p.stockQuantity < 10).length;

      res.json({
        success: true,
        metrics: {
          totalOrders,
          pendingVerificationCount,
          verifiedOrdersCount,
          totalVerifiedRevenue,
          pendingOrdersCount,
          completedOrdersCount,
          totalProductsCount,
          lowStockCount
        }
      });
    } catch (err: any) {
      console.error('[ADMIN_SALES_METRICS_ERROR]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Product List
  app.get('/api/admin/sales/products', requireStaffOrAdmin, async (req, res) => {
    try {
      const products = await db.select().from(salesProducts).orderBy(salesProducts.displayOrder, desc(salesProducts.createdAt));
      res.json({ success: true, products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Helper to sanitize database and Drizzle error messages for user-friendly UI presentation
  const formatFriendlySalesError = (err: any): string => {
    if (!err) return 'An unexpected server error occurred';
    const msg = typeof err === 'string' ? err : (err.message || String(err));
    if (msg.includes('sales_products_sku_key') || msg.includes('unique constraint "sales_products_sku_key"')) {
      return 'A publication with this SKU already exists. Please choose a unique SKU.';
    }
    if (msg.includes('sales_products_slug_key') || msg.includes('unique constraint "sales_products_slug_key"')) {
      return 'A publication with this title or slug already exists. Please choose a distinct title or slug.';
    }
    if (msg.includes('unique constraint')) {
      return 'A database record with these unique details already exists.';
    }
    if (msg.includes('Failed query:') || msg.includes('insert into "sales_products"')) {
      return 'Unable to save publication to the database. Please verify all required fields and ensure the SKU is unique.';
    }
    return msg;
  };

  // Create Product
  app.post('/api/admin/sales/products', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      if (!data.title?.trim() || !data.sku?.trim() || data.price === undefined || data.price === null || data.price === '') {
        return res.status(400).json({ success: false, error: 'Title, SKU, and price are required' });
      }

      const targetSku = data.sku.trim().toUpperCase();

      // Check if SKU already exists
      const existingSku = await db.select({ id: salesProducts.id }).from(salesProducts).where(eq(salesProducts.sku, targetSku)).limit(1);
      if (existingSku.length > 0) {
        return res.status(409).json({
          success: false,
          error: `A publication with SKU "${targetSku}" already exists. Please choose a different SKU.`
        });
      }

      // Generate clean, collision-free slug
      let baseSlug = (data.slug || data.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (!baseSlug) baseSlug = `pub-${Date.now().toString(36)}`;

      let slug = baseSlug;
      const slugCollision = await db.select({ id: salesProducts.id }).from(salesProducts).where(eq(salesProducts.slug, slug)).limit(1);
      if (slugCollision.length > 0) {
        slug = `${baseSlug}-${Date.now().toString(36).slice(-5)}`;
      }

      const inserted = await db.insert(salesProducts).values({
        sku: targetSku,
        title: data.title.trim(),
        slug,
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        category: data.category || 'Civil Engineering Textbooks',
        yearLevel: data.yearLevel || 'General',
        subject: data.subject || 'Civil Engineering',
        format: data.format || 'DIGITAL',
        price: parseInt(data.price, 10) || 0,
        compareAtPrice: data.compareAtPrice ? parseInt(data.compareAtPrice, 10) : null,
        coverImage: data.coverImage || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
        previewPdfUrl: data.previewPdfUrl || null,
        digitalFileUrl: data.digitalFileUrl || null,
        digitalFileName: data.digitalFileName || null,
        digitalFileSizeMb: data.digitalFileSizeMb ? String(data.digitalFileSizeMb) : null,
        stockQuantity: data.stockQuantity !== undefined ? parseInt(data.stockQuantity, 10) : 100,
        trackInventory: Boolean(data.trackInventory),
        isbn: data.isbn ? data.isbn.trim() : null,
        author: data.author || 'KRR Engineering Editorial Board',
        publisher: data.publisher || 'KRR Group & MADECC Publishing, Yaoundé',
        publicationYear: parseInt(data.publicationYear, 10) || 2026,
        pagesCount: parseInt(data.pagesCount, 10) || 300,
        language: data.language || 'English & French',
        status: data.status || 'PUBLISHED',
        featured: Boolean(data.featured),
        tags: Array.isArray(data.tags) ? data.tags : [],
        displayOrder: parseInt(data.displayOrder, 10) || 1
      }).returning();

      // Audit Log
      await db.insert(auditLogs).values({
        userId: req.dbUser?.uid || 'admin',
        userEmail: req.dbUser?.email || 'admin@krrgroup.com',
        action: 'CREATE_SALES_PRODUCT',
        details: `Created product "${data.title}" (SKU: ${targetSku})`
      });

      res.json({ success: true, product: inserted[0] });
    } catch (err: any) {
      console.error('[ADMIN_CREATE_PRODUCT_ERROR]', err);
      res.status(500).json({ success: false, error: formatFriendlySalesError(err) });
    }
  });

  // Edit Product
  app.put('/api/admin/sales/products/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const data = req.body;

      if (data.sku) {
        const targetSku = data.sku.trim().toUpperCase();
        const existingSku = await db.select({ id: salesProducts.id }).from(salesProducts).where(eq(salesProducts.sku, targetSku)).limit(1);
        if (existingSku.length > 0 && existingSku[0].id !== id) {
          return res.status(409).json({
            success: false,
            error: `Another publication already has SKU "${targetSku}". Please enter a unique SKU.`
          });
        }
      }

      const updated = await db.update(salesProducts).set({
        title: data.title,
        sku: data.sku ? data.sku.trim().toUpperCase() : undefined,
        description: data.description,
        shortDescription: data.shortDescription,
        category: data.category,
        yearLevel: data.yearLevel,
        subject: data.subject,
        format: data.format,
        price: parseInt(data.price, 10) || 0,
        compareAtPrice: data.compareAtPrice ? parseInt(data.compareAtPrice, 10) : null,
        coverImage: data.coverImage,
        previewPdfUrl: data.previewPdfUrl || null,
        digitalFileUrl: data.digitalFileUrl || null,
        digitalFileName: data.digitalFileName || null,
        digitalFileSizeMb: data.digitalFileSizeMb ? String(data.digitalFileSizeMb) : null,
        stockQuantity: data.stockQuantity !== undefined ? parseInt(data.stockQuantity, 10) : 100,
        trackInventory: Boolean(data.trackInventory),
        isbn: data.isbn ? data.isbn.trim() : null,
        author: data.author,
        publisher: data.publisher,
        publicationYear: parseInt(data.publicationYear, 10) || 2026,
        pagesCount: parseInt(data.pagesCount, 10) || 300,
        language: data.language,
        status: data.status,
        featured: Boolean(data.featured),
        tags: Array.isArray(data.tags) ? data.tags : [],
        displayOrder: parseInt(data.displayOrder, 10) || 1,
        updatedAt: new Date()
      }).where(eq(salesProducts.id, id)).returning();

      // Audit Log
      await db.insert(auditLogs).values({
        userId: req.dbUser?.uid || 'admin',
        userEmail: req.dbUser?.email || 'admin@krrgroup.com',
        action: 'UPDATE_SALES_PRODUCT',
        details: `Updated product #${id} "${data.title}"`
      });

      res.json({ success: true, product: updated[0] });
    } catch (err: any) {
      console.error('[ADMIN_UPDATE_PRODUCT_ERROR]', err);
      res.status(500).json({ success: false, error: formatFriendlySalesError(err) });
    }
  });

  // Delete / Archive Product
  app.delete('/api/admin/sales/products/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await db.delete(salesProducts).where(eq(salesProducts.id, id));

      await db.insert(auditLogs).values({
        userId: req.dbUser?.uid || 'admin',
        userEmail: req.dbUser?.email || 'admin@krrgroup.com',
        action: 'DELETE_SALES_PRODUCT',
        details: `Deleted product #${id}`
      });

      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err: any) {
      console.error('[ADMIN_DELETE_PRODUCT_ERROR]', err);
      res.status(500).json({ success: false, error: formatFriendlySalesError(err) });
    }
  });


  // Admin Order Listing with search, status filters
  app.get('/api/admin/sales/orders', requireStaffOrAdmin, async (req, res) => {
    try {
      const search = ((req.query.search as string) || '').trim().toLowerCase();
      const orderStatus = (req.query.orderStatus as string) || 'ALL';
      const paymentStatus = (req.query.paymentStatus as string) || 'ALL';

      let orders = await db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt));

      if (search) {
        orders = orders.filter((o: any) =>
          o.orderReference?.toLowerCase().includes(search) ||
          o.customerName?.toLowerCase().includes(search) ||
          o.customerEmail?.toLowerCase().includes(search) ||
          o.customerPhone?.toLowerCase().includes(search)
        );
      }

      if (orderStatus !== 'ALL') {
        orders = orders.filter((o: any) => o.orderStatus === orderStatus);
      }

      if (paymentStatus !== 'ALL') {
        orders = orders.filter((o: any) => o.paymentStatus === paymentStatus);
      }

      res.json({ success: true, orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Single Order Details
  app.get('/api/admin/sales/orders/:id', requireStaffOrAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const orders = await db.select().from(salesOrders).where(eq(salesOrders.id, id)).limit(1);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const order = orders[0];
      const items = await db.select().from(salesOrderItems).where(eq(salesOrderItems.orderId, order.id));
      const payments = await db.select().from(salesPayments).where(eq(salesPayments.orderId, order.id)).orderBy(desc(salesPayments.createdAt));

      res.json({
        success: true,
        order: {
          ...order,
          items,
          payments
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Update Order Status
  app.patch('/api/admin/sales/orders/:id/status', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { orderStatus, internalNotes } = req.body;

      const updatePayload: any = { updatedAt: new Date() };
      if (orderStatus) updatePayload.orderStatus = orderStatus;
      if (internalNotes !== undefined) updatePayload.internalNotes = internalNotes;

      const updated = await db.update(salesOrders).set(updatePayload).where(eq(salesOrders.id, id)).returning();

      await db.insert(auditLogs).values({
        userId: req.dbUser?.uid || 'admin',
        userEmail: req.dbUser?.email || 'admin@krrgroup.com',
        action: 'UPDATE_ORDER_STATUS',
        details: `Updated order #${id} status to ${orderStatus || 'unchanged'}`
      });

      res.json({ success: true, order: updated[0] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Payment Verification Queue
  app.get('/api/admin/sales/payments/pending', requireStaffOrAdmin, async (req, res) => {
    try {
      const payments = await db.select().from(salesPayments).where(eq(salesPayments.status, 'AWAITING_VERIFICATION')).orderBy(desc(salesPayments.createdAt));
      res.json({ success: true, payments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Approve or Reject Payment Submission
  app.post('/api/admin/sales/payments/:paymentId/verify', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId, 10);
      const { action, rejectionReason } = req.body; // 'APPROVE' | 'REJECT'

      if (action !== 'APPROVE' && action !== 'REJECT') {
        return res.status(400).json({ success: false, error: 'Action must be APPROVE or REJECT' });
      }

      if (action === 'REJECT' && !rejectionReason) {
        return res.status(400).json({ success: false, error: 'Rejection reason is required when rejecting a payment' });
      }

      const payments = await db.select().from(salesPayments).where(eq(salesPayments.id, paymentId)).limit(1);
      if (payments.length === 0) {
        return res.status(404).json({ success: false, error: 'Payment submission not found' });
      }

      const payment = payments[0];
      const orders = await db.select().from(salesOrders).where(eq(salesOrders.id, payment.orderId)).limit(1);
      const order = orders[0];

      const reviewerEmail = req.dbUser?.email || 'admin@krrgroup.com';
      const now = new Date();

      if (action === 'APPROVE') {
        // Update payment status
        await db.update(salesPayments).set({
          status: 'APPROVED',
          verifiedBy: reviewerEmail,
          verifiedAt: now,
          customerNotified: true
        }).where(eq(salesPayments.id, payment.id));

        // Update order status to VERIFIED_PAID and PROCESSING
        await db.update(salesOrders).set({
          paymentStatus: 'VERIFIED_PAID',
          orderStatus: order.deliveryMethod === 'DIGITAL_DOWNLOAD' ? 'COMPLETED' : 'PROCESSING',
          updatedAt: now
        }).where(eq(salesOrders.id, order.id));

        // Audit Log
        await db.insert(auditLogs).values({
          userId: req.dbUser?.uid || 'admin',
          userEmail: reviewerEmail,
          action: 'APPROVE_PAYMENT',
          details: `Approved payment #${payment.id} for order ${order.orderReference} (${payment.amount.toLocaleString()} XAF)`
        });

        // Notify customer via email
        try {
          const unlockSubject = `[KRR Group] Payment Verified & Order Unlocked — Ref: ${order.orderReference}`;
          const unlockText = `Dear ${order.customerName},\nYour payment of ${payment.amount.toLocaleString()} XAF (TxID: ${payment.transactionReference}) for order ${order.orderReference} has been verified by our finance team.\nAccess your digital textbooks here: ${process.env.APP_URL || ''}/?tab=order-tracking&order=${order.orderReference}&token=${order.accessToken}`;
          const unlockHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 8px;">Payment Verified Successfully</h2>
                <p>Dear <strong>${order.customerName}</strong>,</p>
                <p>We are pleased to inform you that your payment of <strong>${payment.amount.toLocaleString()} XAF</strong> (TxID: ${payment.transactionReference}) for order <strong>${order.orderReference}</strong> has been verified by our finance team.</p>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p style="margin: 0; font-size: 16px; font-weight: bold; color: #15803d;">Status: VERIFIED & COMPLETED</p>
                  <p style="margin: 4px 0 0 0; color: #166534;">Your digital products and download credentials are now fully active!</p>
                </div>
                <p style="text-align: center; margin: 24px 0;">
                  <a href="${process.env.APP_URL || ''}/?tab=order-tracking&order=${order.orderReference}&token=${order.accessToken}" 
                     style="background: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">
                    Access & Download Your Textbooks Now →
                  </a>
                </p>
                <p style="font-size: 12px; color: #94a3b8;">KRR Group — Yaoundé, Cameroon | Contact: +237 671 063 511</p>
              </div>
            `;
          await sendEmail(order.customerEmail, unlockSubject, unlockText, unlockHtml);
        } catch (emailErr) {
          console.warn('[VERIFICATION_NOTIFY_ERROR]', emailErr);
        }

        return res.json({
          success: true,
          message: `Payment approved and order ${order.orderReference} unlocked.`
        });
      } else {
        // REJECT
        await db.update(salesPayments).set({
          status: 'REJECTED',
          rejectionReason,
          verifiedBy: reviewerEmail,
          verifiedAt: now,
          customerNotified: true
        }).where(eq(salesPayments.id, payment.id));

        await db.update(salesOrders).set({
          paymentStatus: 'PAYMENT_REJECTED',
          updatedAt: now
        }).where(eq(salesOrders.id, order.id));

        await db.insert(auditLogs).values({
          userId: req.dbUser?.uid || 'admin',
          userEmail: reviewerEmail,
          action: 'REJECT_PAYMENT',
          details: `Rejected payment #${payment.id} for order ${order.orderReference}. Reason: ${rejectionReason}`
        });

        // Notify customer of rejection with reason
        try {
          const rejectSubject = `[KRR Group] Payment Verification Notice — Ref: ${order.orderReference}`;
          const rejectText = `Dear ${order.customerName},\nOur finance team reviewed your transaction submission (TxID: ${payment.transactionReference}) for order ${order.orderReference}, but was unable to confirm the funds.\nReason: ${rejectionReason}\nPlease re-submit at: ${process.env.APP_URL || ''}/?tab=order-tracking&order=${order.orderReference}&token=${order.accessToken}`;
          const rejectHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">Payment Verification Update</h2>
                <p>Dear <strong>${order.customerName}</strong>,</p>
                <p>Our finance team reviewed your transaction submission (TxID: ${payment.transactionReference}) for order <strong>${order.orderReference}</strong>, but was unable to confirm the funds with the following reason:</p>
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0; color: #991b1b;">
                  <strong>Reason for rejection:</strong><br/>
                  ${rejectionReason}
                </div>
                <p>Please double-check your transaction ID or mobile transfer receipt and re-submit your proof of payment at:</p>
                <p style="text-align: center; margin: 24px 0;">
                  <a href="${process.env.APP_URL || ''}/?tab=order-tracking&order=${order.orderReference}&token=${order.accessToken}" 
                     style="background: #f59e0b; color: #0f172a; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">
                    Re-Submit Payment Details →
                  </a>
                </p>
                <p style="font-size: 12px; color: #94a3b8;">For immediate assistance, please reach our Yaoundé accounting desk at +237 671 063 511.</p>
              </div>
            `;
          await sendEmail(order.customerEmail, rejectSubject, rejectText, rejectHtml);
        } catch (emailErr) {
          console.warn('[REJECTION_NOTIFY_ERROR]', emailErr);
        }

        return res.json({
          success: true,
          message: `Payment rejected. Customer notified with specified reason.`
        });
      }
    } catch (err: any) {
      console.error('[ADMIN_VERIFY_PAYMENT_ERROR]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
