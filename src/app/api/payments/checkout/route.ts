// ✅ FREE COURSE: skip Stripe, enroll directly
if (course.price === 0) {
  const existing = await Enrollment.findOne({ 
    user: session.user.id, 
    course: courseId 
  });
  
  if (!existing) {
    await Enrollment.create({
      user: session.user.id,
      course: courseId,
      status: 'active',
      progress: 0,
      amountPaid: 0,
      paymentId: 'free',
    });
  }
  return NextResponse.json({ free: true, redirectUrl: '/dashboard' });
}
