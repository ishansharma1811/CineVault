const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { code, amount } = body;
    if (!code) return Response.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
    const coupons = await db.entities.Coupon.filter({ code: code.toUpperCase(), active: true });
    const coupon = coupons[0];
    if (!coupon) return Response.json({ success: false, message: 'Invalid or expired coupon' }, { status: 404 });
    const baseAmount = amount || 0;
    if (coupon.minAmount && baseAmount < coupon.minAmount)
      return Response.json({ success: false, message: `Minimum amount ₹${coupon.minAmount} required` }, { status: 400 });
    let discount = 0;
    if (coupon.discountType === 'PERCENT') {
      discount = Math.min(coupon.maxDiscount || Infinity, Math.round(baseAmount * coupon.discountValue / 100));
    } else {
      discount = coupon.discountValue;
    }
    return Response.json({ success: true, discount, code: coupon.code, description: coupon.description });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}