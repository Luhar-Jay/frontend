import { useState } from "react";
import { Lock, MoveRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/UI/Input";
import Button from "../../components/UI/Button";
import { useResetPassword } from "../../apis/api/auth";
import { ApiError } from "../../apis/apiService";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({ password: "", confirm: "" });

  const mutation = useResetPassword();

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="text-lg font-bold mb-2">Invalid Link</h2>
          <p className="text-sm text-gray-500 mb-6">
            This password reset link is missing or malformed. Please request a new one.
          </p>
          <Link to="/forgot-password" className="text-blue-600 underline font-medium text-sm">
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = { password: "", confirm: "" };

    if (password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }
    if (password !== confirm) {
      next.confirm = "Passwords do not match";
    }
    if (next.password || next.confirm) {
      setErrors(next);
      return;
    }

    setErrors({ password: "", confirm: "" });

    try {
      await mutation.mutateAsync({ token, password });
      toast.success("Password reset successfully. You can now sign in.");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = (err as ApiError)?.message || "Failed to reset password. The link may have expired.";
      setErrors({ password: msg, confirm: "" });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-2xl font-bold">EMS Pro</h1>
      <p className="text-sm text-gray-500">Manage your workforce with efficiency</p>

      <div className="bg-white p-6 rounded-xl shadow-md shadow-gray-200 w-full max-w-md mt-8">
        <h2 className="text-lg font-bold">Set new password</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose a strong password — at least 8 characters.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
          <Input
            label="New Password"
            name="password"
            type="password"
            placeholder="Enter new password"
            error={errors.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            icon={<Lock size={18} />}
            required
          />

          <Input
            label="Confirm Password"
            name="confirm"
            type="password"
            placeholder="Confirm new password"
            error={errors.confirm}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full"
            icon={<Lock size={18} />}
            required
          />

          <Button variant="primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Resetting…" : "Reset Password"}
            {!mutation.isPending && <MoveRight size={18} />}
            {mutation.isPending && (
              <CheckCircle2 size={18} className="animate-pulse opacity-60" />
            )}
          </Button>
        </form>
      </div>

      <p className="text-sm text-gray-500 mt-6">
        <Link to="/login" className="text-blue-600 underline font-bold">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;
