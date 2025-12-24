// fee.utils.ts
export function getFeeStatus(user: {
  next_fee_date: Date | null;
  due_amount: number;
  monthly_fee: number;
}) {
  if (user.due_amount === 0) return 'PAID';

  const today = new Date();

  if (user.next_fee_date && user.next_fee_date < today) {
    if (user.due_amount < user.monthly_fee) return 'OVERDUE_PARTIAL';
    return 'OVERDUE';
  }

  if (user.due_amount < user.monthly_fee) return 'PARTIAL';

  return 'DUE';
}
