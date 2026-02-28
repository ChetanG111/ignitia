"use client";

import { useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: name
            });

            // Create user document in Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: name,
                email: email,
                role: "citizen", // Default role
                createdAt: new Date().toISOString()
            });

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError("");
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Use setDoc with merge: true to avoid overwriting roles if they already exist
            // Or just check if it exists first
            await setDoc(doc(db, "users", user.uid), {
                name: user.displayName,
                email: user.email,
                role: "citizen", // Default role for new users
                createdAt: new Date().toISOString()
            }, { merge: true });

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to sign up with Google.");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-md anim-bounce">
                <div className="mb-10 text-center">
                    <Link href="/" className="text-2xl font-bold tracking-tighter text-black inline-block mb-4">
                        A X I S
                    </Link>
                    <h1 className="text-xl font-semibold text-neutral-900">Create your account</h1>
                    <p className="text-neutral-500 text-sm mt-1">Start monitoring infrastructure intelligence today.</p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-xl shadow-neutral-200/50">
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm"
                                placeholder="name@company.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                                <Icon icon="ph:warning-circle-fill" className="text-base shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-black text-white rounded-2xl font-semibold text-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-2 shadow-lg shadow-black/10"
                        >
                            {loading ? "Creating account..." : "Sign up"}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-white text-neutral-400 font-medium">OR CONTINUE WITH</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignup}
                        className="w-full py-3.5 bg-white border border-neutral-200 text-black rounded-2xl font-semibold text-sm hover:bg-neutral-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"
                    >
                        <Icon icon="logos:google-icon" className="text-lg" />
                        Google Account
                    </button>
                </div>

                <p className="mt-8 text-center text-sm text-neutral-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-black font-bold hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    );
}
