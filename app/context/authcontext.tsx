"use client";
import { app } from "@/firebase/firebase";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useContext, useState, createContext, useEffect } from "react";

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
  userid?: string | null;
  userName: string | null;
}

const auth = getAuth(app);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userid, setUserid] = useState<string | null>(null);
  const [userName, setuserName] = useState<string | null>(null);

  const router = useRouter();

  const signup = async (email: string, password: string, username: string) => {
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCred.user;
      
      try {
        await updateProfile(user, { displayName: username });
      } catch (profileError) {
        console.warn("Could not update profile displayName:", profileError);
      }

      setuserName(username);
      const idToken = await user.getIdToken();

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Signup failed");
      }

      if (data.username) {
        setuserName(data.username);
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/auth/signin");
  };

  const createSession = async (user: any) => {
    const idToken = await user.getIdToken();
    await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  };

  const login = async (email: string, password: string) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    await createSession(userCred.user);
    if (userCred.user.displayName) {
      setuserName(userCred.user.displayName);
    }
    router.push("/dashboard");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        setUserid(user.uid);
        const initialName = user.displayName || (user.email ? user.email.split("@")[0] : null);
        if (initialName) {
          setuserName(initialName);
        }

        try {
          const response = await fetch("/api/auth/me", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userid: user.uid }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.userDoc?.username) {
              setuserName(data.userDoc.username);
            }
          }
        } catch (error) {
          console.error("Failed to fetch username:", error);
        }
      } else {
        setUserid(null);
        setuserName(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const isLoggedIn = currentUser ? true : false;

  return (
    <AuthContext.Provider
      value={{ login, signup, logout, isLoggedIn, userid, userName }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};
