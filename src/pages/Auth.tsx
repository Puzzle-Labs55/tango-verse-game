
import React from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useLocation, Link } from "react-router-dom";

const Auth = () => {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-game-muted to-white">
      <AuthForm mode={isLogin ? "login" : "register"} />
      <p className="mt-4 text-sm text-gray-600">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link
          to={isLogin ? "/register" : "/login"}
          className="text-blue-600 hover:underline"
        >
          {isLogin ? "Register" : "Login"}
        </Link>
      </p>
    </div>
  );
};

export default Auth;
