"use client";

import AdminLayout from "..";
import LeaveOverView from "@/components/LeaveOverView";
import withAdminAuth from "@/pages/auth/Authentication";

const EmployeeList = () => {
  return (
    <AdminLayout>
      <LeaveOverView />{" "}
    </AdminLayout>
  );
};

export default withAdminAuth(EmployeeList, ["manager", "admin", "hr", "md"]);
