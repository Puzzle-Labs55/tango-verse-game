
import React from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useLocation, Link } from "react-router-dom";

const Auth = () => {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FEC6A1] to-[#D3E4FD]">
      <div className="animate-fade-in">
        <AuthForm mode={isLogin ? "login" : "register"} />
        <p className="mt-4 text-sm text-gray-700">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link
            to={isLogin ? "/register" : "/login"}
            className="text-blue-600 hover:underline font-medium"
          >
            {isLogin ? "Register" : "Login"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
