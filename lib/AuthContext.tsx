"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signOut as firebaseSignOut
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

interface ExtendedUser extends FirebaseUser {
    role?: "citizen" | "authority";
}

interface AuthContextType {
    user: ExtendedUser | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<ExtendedUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeDoc: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Set initial user while we wait for snapshot
                setUser(firebaseUser as ExtendedUser);

                // Set up real-time listener for user data (role updates)
                unsubscribeDoc = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
                    const userData = docSnap.data();
                    setUser({
                        ...firebaseUser,
                        role: userData?.role || "citizen"
                    } as ExtendedUser);
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user document:", error);
                    setLoading(false);
                });
            } else {
                if (unsubscribeDoc) unsubscribeDoc();
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
