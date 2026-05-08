import { useState } from "react";
import { Mail, MoveRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import Input from "../../components/UI/Input";
import Button from "../../components/UI/Button";
import { useForgotPassword } from "../../apis/api/auth";
import { ApiError } from "../../apis/apiService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    try {
      await mutation.mutateAsync({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setEmailError((err as ApiError)?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-2xl font-bold">EMS Pro</h1>
      <p className="text-sm text-gray-500">Manage your workforce with efficiency</p>

      <div className="bg-white p-6 rounded-xl shadow-md shadow-gray-200 w-full max-w-md mt-8">
        {sent ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-lg font-bold">Check your email</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              If <span className="font-medium text-gray-800">{email}</span> is registered, you'll
              receive a password reset link shortly. The link expires in 15 minutes.
            </p>
            <Link
              to="/login"
              className="mt-2 text-sm text-blue-600 hover:underline font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold">Forgot your password?</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your email address and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="Enter your email"
                error={emailError}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                icon={<Mail size={18} />}
                required
              />

              <Button
                variant="primary"
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Sending…" : "Send Reset Link"}
                <MoveRight size={18} />
              </Button>
            </form>
          </>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-6">
        Remember your password?{" "}
        <Link to="/login" className="text-blue-600 underline font-bold">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
