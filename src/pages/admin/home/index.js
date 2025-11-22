"use client";

import AdminLayout from "..";
import Link from "next/link";
import Links from "./Links";
import withAdminAuth from "@/pages/auth/Authentication";

const Home = () => {
  return (
    <AdminLayout>
      <Links />
    </AdminLayout>
  );
};

export default withAdminAuth(Home, ["manager", "admin", "hr", "md"]);
