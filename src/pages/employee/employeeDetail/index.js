"use client";

import EmployeeLayout from "..";
import LeaveOverView from "@/components/LeaveOverView";
import withAdminAuth from "@/pages/auth/Authentication";

const EmployeeList = () => {
  return (
    <EmployeeLayout>
      <LeaveOverView />
    </EmployeeLayout>
  );
};

export default withAdminAuth(EmployeeList, ["employee"]);
