  type Room = {
    room_id: string;
    room_number: string;
    floor_number: number;
    available_beds: number;
  };

  type User = {
    user_id: string;
    user_name: string;
    email?: string;
    mobile?: string;
    joining_date: string;
    monthly_fee: number;
    due_amount: number;
    delay_days: number;
    next_fee_date?: string;
    status: string;
    user_fee_receipt?: string;
    room?: Room;
  };


  type UserForm = {
    user_name: string;
    email: string;
    mobile: string;
    monthly_fee: string;
    joining_date: string;
    room_id: string;
    status: string;
    payment_type: string;
    paid_amount: string;
    user_fee_receipt: string;
    user_fee_receipt_file: File | null;
    user_fee_receipt_preview: string;
  };

  type UserTableProps = {
  users: User[];
  loading: boolean;
  amount: number;

  openDeleteModal: (userId: string) => void;
  openEditModal: (user: User) => void;
  openCollectModal: (user: User) => void;

  getFeeStatus: (user: User) => string;
  setReceiptPreview: (url: string) => void;
};


type UserHeaderProps = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  fetchUsers: () => void;
};