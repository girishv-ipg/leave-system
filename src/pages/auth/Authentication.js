// hoc/withAdminAuth.js

import { useEffect, useState } from "react";

import { useRouter } from "next/router";

const withAdminAuth = (WrappedComponent, allowedRoles = []) => {
  return function WithAdminAuth(props) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !allowedRoles.includes(user.role)) {
        router.replace("/"); // Redirect if role not allowed
      } else {
        setIsAuthorized(true);
      }
    }, []);

    if (!isAuthorized) return null; // Show nothing or a loading state

    return <WrappedComponent {...props} />;
  };
};

export default withAdminAuth;
