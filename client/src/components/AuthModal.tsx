import { useState } from "react";
import { useAuth } from "../lib/stores/useAuth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Users, User, UserPlus } from "lucide-react";

interface AuthModalProps {
  onClose?: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login, register, loginAsGuest, isLoading, error, clearError } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(loginForm.username, loginForm.password);
      onClose?.();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setRegisterError(null);

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }

    if (registerForm.password.length < 3) {
      setRegisterError("Password must be at least 3 characters long");
      return;
    }

    try {
      await register(registerForm.username, registerForm.password);
      onClose?.();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleGuestLogin = async () => {
    clearError();
    try {
      await loginAsGuest();
      onClose?.();
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Chess RPG Battle
          </CardTitle>
          <CardDescription className="text-gray-300">
            Choose your authentication method to start playing
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="w-full">
            <div className="grid w-full grid-cols-2 bg-gray-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                  activeTab === 'login'
                    ? 'bg-gray-700 text-white shadow'
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                  activeTab === 'register'
                    ? 'bg-gray-700 text-white shadow'
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Register
              </button>
            </div>

            {activeTab === 'login' && (
              <div className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-gray-200">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-200">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="bg-red-900/50 border-red-700">
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>
              </form>
              </div>
            )}

            {activeTab === 'register' && (
              <div className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username" className="text-gray-200">Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    placeholder="Choose a username"
                    required
                    disabled={isLoading}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-gray-200">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Create a password"
                    required
                    disabled={isLoading}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password" className="text-gray-200">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
                {(error || registerError) && (
                  <Alert variant="destructive" className="bg-red-900/50 border-red-700">
                    <AlertDescription className="text-red-200">
                      {registerError || error}
                    </AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-400">Or</span>
            </div>
          </div>
          
          <Button 
            onClick={handleGuestLogin}
            variant="outline" 
            className="w-full border-gray-600 bg-gray-800 text-white hover:bg-gray-700" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating guest...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Continue as Guest
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-400 text-center">
            Guest accounts can play but won't save your progress
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}