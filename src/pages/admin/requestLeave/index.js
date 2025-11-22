import AdminLayout from "..";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import withAdminAuth from "@/pages/auth/Authentication";

const index = () => {
  return (
    <AdminLayout>
      <LeaveRequestForm />
    </AdminLayout>
  );
};

export default withAdminAuth(index, ["admin", "manager", "hr", "md"]);
