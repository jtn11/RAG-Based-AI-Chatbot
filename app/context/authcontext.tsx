"use client";
import { app } from "@/firebase/firebase";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
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
      const idToken = await user.getIdToken();

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken, username }),
      });

      const data = await response.json();
      console.log({ data: data, username: data.username });
      setuserName(data.username);
      console.log(data);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Signup failed");
      }

      // Sign in the user on the client side after successful creation

      router.push("/dashboard");
    } catch (error) {
      console.log("Error", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/auth/signin");
  };

  const createSession = async (user: any) => {
    const idToken = await user.getIdToken();
    await fetch("api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  };

  const login = async (email: string, password: string) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    await createSession(userCred.user);
    const user = userCred.user;
    console.log(user);
    router.push("/dashboard");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        setUserid(user.uid);

        try {
          const response = await fetch("/api/auth/me", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userid: user.uid }),
          });

          const data = await response.json();

          if (response.ok && data.userDoc) {
            setuserName(data.userDoc.username);
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
